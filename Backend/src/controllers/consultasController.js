const { pool }  = require('../config/database');
const { enviarEmail, emailConfirmacaoConsulta } = require('../utils/email');

// GET /api/consultas?pagina=1&limite=50  (admin/recepcao vê tudo; médico vê só as suas)
// Resposta: { dados: [...], total, pagina, limite, paginas }
async function listar(req, res, next) {
  try {
    const { estado, medico_id, data_inicio, data_fim, paciente_id } = req.query;
    const u = req.utilizador;

    // ── Paginação ─────────────────────────────────────────────────────────────
    const LIMITE_MAX = 100;
    const limite  = Math.min(Math.max(parseInt(req.query.limite)  || 50, 1), LIMITE_MAX);
    const pagina  = Math.max(parseInt(req.query.pagina) || 1, 1);
    const offset  = (pagina - 1) * limite;

    // ── Base da query ─────────────────────────────────────────────────────────
    const selectCols = `
      c.id, c.data_hora, c.duracao_min, c.estado, c.tipo, c.motivo,
      p.id AS paciente_id, p.nome AS paciente_nome, p.telefone AS paciente_tel,
      m.id AS medico_id, CONCAT(m.titulo,' ',m.nome) AS medico_nome,
      e.nome AS especialidade
    `;
    let where  = `WHERE 1=1`;
    const params = [];

    // Médico só vê as suas
    if (u.role === 'medico') {
      const [[med]] = await pool.execute(
        `SELECT id FROM medicos WHERE utilizador_id = ?`, [u.id]
      );
      if (med) { where += ` AND c.medico_id = ?`; params.push(med.id); }
    } else if (medico_id) {
      where += ` AND c.medico_id = ?`; params.push(medico_id);
    }

    if (estado)      { where += ` AND c.estado = ?`;           params.push(estado); }
    if (paciente_id) { where += ` AND c.paciente_id = ?`;      params.push(paciente_id); }
    if (data_inicio) { where += ` AND DATE(c.data_hora) >= ?`; params.push(data_inicio); }
    if (data_fim)    { where += ` AND DATE(c.data_hora) <= ?`; params.push(data_fim); }

    const joins = `
      FROM consultas c
      JOIN pacientes p      ON c.paciente_id     = p.id
      JOIN medicos m        ON c.medico_id        = m.id
      JOIN especialidades e ON c.especialidade_id = e.id
    `;

    // Contar total para calcular páginas (mesmos filtros, sem LIMIT)
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total ${joins} ${where}`,
      params
    );

    // Resultados desta página
    const [dados] = await pool.execute(
      `SELECT ${selectCols} ${joins} ${where} ORDER BY c.data_hora DESC LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    res.json({
      dados,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    });
  } catch (err) { next(err); }
}

// GET /api/consultas/:id
async function obter(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, p.nome AS paciente_nome, p.email AS paciente_email, p.telefone AS paciente_tel,
             p.data_nascimento, CONCAT(m.titulo,' ',m.nome) AS medico_nome, e.nome AS especialidade
      FROM consultas c
      JOIN pacientes p      ON c.paciente_id      = p.id
      JOIN medicos m        ON c.medico_id         = m.id
      JOIN especialidades e ON c.especialidade_id  = e.id
      WHERE c.id = ?
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Consulta não encontrada.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /api/consultas  (público — marcação online)
async function criar(req, res, next) {
  try {
    const {
      // Dados do paciente
      paciente_nome, paciente_email, paciente_telefone, paciente_nascimento, paciente_bi,
      // Dados da consulta
      medico_id, especialidade_id, hospital_id, data_hora, tipo = 'presencial', motivo,
      duracao_min = 30, // duração padrão em minutos; pode ser enviada pelo frontend
    } = req.body;
    const [[vinculo]] = await pool.execute(
      `SELECT m.id
       FROM medicos m
       JOIN hospital_medicos hm ON hm.medico_id = m.id
       WHERE m.id = ?
         AND m.especialidade_id = ?
         AND hm.hospital_id = ?
         AND m.ativo = 1`,
      [medico_id, especialidade_id, hospital_id]
    );
    if (!vinculo) {
      return res.status(422).json({
        erro: 'O médico selecionado não atende esta especialidade neste hospital.',
      });
    }
    // ── [MÉDIA 1] Verificar conflito por INTERVALO, não por hora exacta ─────────
    // Uma nova consulta de `duracao_min` minutos a partir de `data_hora` conflitua
    // com qualquer outra consulta do médico cuja janela temporal se sobreponha.
    //
    // Condição de sobreposição entre [A_início, A_fim[ e [B_início, B_fim[:
    //   A_início < B_fim  AND  A_fim > B_início
    //
    // Substituindo A = consulta existente, B = nova consulta:
    //   consulta.data_hora < nova_fim  AND  consulta_fim > data_hora (nova)
    const [conflito] = await pool.execute(
      `SELECT id FROM consultas
       WHERE medico_id = ?
         AND estado NOT IN ('cancelada','falta')
         AND data_hora             < DATE_ADD(?, INTERVAL ? MINUTE)
         AND DATE_ADD(data_hora, INTERVAL COALESCE(duracao_min, 30) MINUTE) > ?`,
      [medico_id, data_hora, duracao_min, data_hora]
    );
    if (conflito.length) {
      return res.status(409).json({
        erro: 'Este horário já está ocupado (incluindo sobreposição de duração). Por favor, escolha outro.',
      });
    }

    // ── [MÉDIA 2] Criar ou encontrar paciente sem sobrescrever dados existentes ──
    // Se o paciente já existe pelo telefone, actualizar APENAS os campos que vieram
    // preenchidos no formulário — campos em branco não apagam dados anteriores.
    let pacienteId;
    const [[pacExiste]] = await pool.execute(
      `SELECT id FROM pacientes WHERE telefone = ?`, [paciente_telefone]
    );
    if (pacExiste) {
      pacienteId = pacExiste.id;
      // COALESCE garante que um campo null/vazio no formulário não apaga o valor guardado
      await pool.execute(
        `UPDATE pacientes
         SET nome             = COALESCE(?, nome),
             email            = COALESCE(NULLIF(?, ''), email),
             data_nascimento  = COALESCE(NULLIF(?, ''), data_nascimento),
             bi               = COALESCE(NULLIF(?, ''), bi),
             atualizado_em    = NOW()
         WHERE id = ?`,
        [
          paciente_nome         || null,
          paciente_email        || null,
          paciente_nascimento   || null,
          paciente_bi           || null,
          pacienteId,
        ]
      );
    } else {
      const [r] = await pool.execute(
        `INSERT INTO pacientes (nome, email, telefone, data_nascimento, bi) VALUES (?,?,?,?,?)`,
        [paciente_nome, paciente_email || null, paciente_telefone,
         paciente_nascimento || null, paciente_bi || null]
      );
      pacienteId = r.insertId;
    }

    // ── Criar consulta ────────────────────────────────────────────────────────
    const [result] = await pool.execute(
      `INSERT INTO consultas (paciente_id, medico_id, especialidade_id, hospital_id, data_hora, duracao_min, tipo, motivo, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [pacienteId, medico_id, especialidade_id, hospital_id || null, data_hora, duracao_min, tipo, motivo || null]
    );

    const consultaId = result.insertId;

    // ── Enviar email de confirmação ───────────────────────────────────────────
    if (paciente_email) {
      try {
        const [[med]] = await pool.execute(
          `SELECT CONCAT(titulo,' ',nome) AS nome FROM medicos WHERE id=?`, [medico_id]
        );
        const [[esp]] = await pool.execute(
          `SELECT nome FROM especialidades WHERE id=?`, [especialidade_id]
        );
        const appName = process.env.APP_NAME || 'Hospital Vida Saudável';
        const htmlEmail = emailConfirmacaoConsulta(
          { nome: paciente_nome },
          { data_hora, tipo },
          med?.nome || 'Médico',
          esp?.nome || 'Especialidade'
        );
        await enviarEmail({
          para:    paciente_email,
          assunto: `Confirmação de Consulta — ${appName}`,
          html:    htmlEmail,
        });
      } catch (emailErr) {
        console.warn('Aviso: email não enviado:', emailErr.message);
      }
    }

    res.status(201).json({ id: consultaId, mensagem: 'Consulta agendada com sucesso!' });
  } catch (err) { next(err); }
}

// PATCH /api/consultas/:id/estado  (admin/recepcao/medico)
async function atualizarEstado(req, res, next) {
  try {
    const { estado, notas_medico } = req.body;
    const estadosValidos = ['pendente','confirmada','concluida','cancelada','falta'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ erro: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
    }

    await pool.execute(
      `UPDATE consultas SET estado = ?, notas_medico = COALESCE(?, notas_medico) WHERE id = ?`,
      [estado, notas_medico || null, req.params.id]
    );
    res.json({ mensagem: `Consulta marcada como "${estado}".` });
  } catch (err) { next(err); }
}

// DELETE /api/consultas/:id  (admin / recepcao)
async function cancelar(req, res, next) {
  try {
    const consultaId    = req.params.id;
    const utilizadorId  = req.utilizador?.id || null;

    // 1. Verificar que a consulta existe e não está já cancelada
    const [[consulta]] = await pool.execute(
      `SELECT id, estado FROM consultas WHERE id = ?`,
      [consultaId]
    );
    if (!consulta) {
      return res.status(404).json({ erro: 'Consulta não encontrada.' });
    }
    if (consulta.estado === 'cancelada') {
      return res.status(409).json({ erro: 'A consulta já se encontra cancelada.' });
    }

    // 2. Cancelar com registo de auditoria (quem cancelou e quando)
    // Requer colunas cancelado_por e cancelado_em na tabela consultas.
    // Script de migração em setupDatabase.js ou executar manualmente:
    //   ALTER TABLE consultas
    //     ADD COLUMN cancelado_por INT NULL,
    //     ADD COLUMN cancelado_em  DATETIME NULL,
    //     ADD FOREIGN KEY (cancelado_por) REFERENCES utilizadores(id) ON DELETE SET NULL;
    await pool.execute(
      `UPDATE consultas
       SET estado        = 'cancelada',
           cancelado_por = ?,
           cancelado_em  = NOW()
       WHERE id = ?`,
      [utilizadorId, consultaId]
    );

    res.json({ mensagem: 'Consulta cancelada.' });
  } catch (err) { next(err); }
}

// GET /api/consultas/dashboard  (admin)
async function dashboard(req, res, next) {
  try {
    const [[totais]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(estado = 'pendente')   AS pendentes,
        SUM(estado = 'confirmada') AS confirmadas,
        SUM(estado = 'concluida')  AS concluidas,
        SUM(estado = 'cancelada')  AS canceladas
      FROM consultas
    `);

    const [[hoje]] = await pool.execute(`
      SELECT COUNT(*) AS total_hoje FROM consultas
      WHERE DATE(data_hora) = CURDATE() AND estado NOT IN ('cancelada','falta')
    `);

    const [porEspecialidade] = await pool.execute(`
      SELECT e.nome, COUNT(*) AS total
      FROM consultas c JOIN especialidades e ON c.especialidade_id = e.id
      GROUP BY e.id ORDER BY total DESC LIMIT 6
    `);

    const [proximasConsultas] = await pool.execute(`
      SELECT c.id, c.data_hora, c.estado,
             p.nome AS paciente, CONCAT(m.titulo,' ',m.nome) AS medico, e.nome AS especialidade
      FROM consultas c
      JOIN pacientes p      ON c.paciente_id = p.id
      JOIN medicos m        ON c.medico_id = m.id
      JOIN especialidades e ON c.especialidade_id = e.id
      WHERE c.data_hora >= NOW() AND c.estado NOT IN ('cancelada','falta')
      ORDER BY c.data_hora ASC LIMIT 10
    `);

    res.json({ totais, hoje: hoje.total_hoje, porEspecialidade, proximasConsultas });
  } catch (err) { next(err); }
}

module.exports = { listar, obter, criar, atualizarEstado, cancelar, dashboard };
