const { pool }  = require('../config/database');
const { enviarEmail, emailConfirmacaoConsulta } = require('../utils/email');

// GET /api/consultas  (admin/recepcao vê tudo; médico vê só as suas)
async function listar(req, res, next) {
  try {
    const { estado, medico_id, data_inicio, data_fim, paciente_id } = req.query;
    const u = req.utilizador;

    let sql = `
      SELECT c.id, c.data_hora, c.duracao_min, c.estado, c.tipo, c.motivo,
             p.id AS paciente_id, p.nome AS paciente_nome, p.telefone AS paciente_tel,
             m.id AS medico_id, CONCAT(m.titulo,' ',m.nome) AS medico_nome,
             e.nome AS especialidade
      FROM consultas c
      JOIN pacientes p      ON c.paciente_id      = p.id
      JOIN medicos m        ON c.medico_id         = m.id
      JOIN especialidades e ON c.especialidade_id  = e.id
      WHERE 1=1
    `;
    const params = [];

    // Médico só vê as suas
    if (u.role === 'medico') {
      const [[med]] = await pool.execute(`SELECT id FROM medicos WHERE utilizador_id = ?`, [u.id]);
      if (med) { sql += ` AND c.medico_id = ?`; params.push(med.id); }
    } else if (medico_id) {
      sql += ` AND c.medico_id = ?`; params.push(medico_id);
    }

    if (estado)      { sql += ` AND c.estado = ?`;              params.push(estado); }
    if (paciente_id) { sql += ` AND c.paciente_id = ?`;         params.push(paciente_id); }
    if (data_inicio) { sql += ` AND DATE(c.data_hora) >= ?`;    params.push(data_inicio); }
    if (data_fim)    { sql += ` AND DATE(c.data_hora) <= ?`;    params.push(data_fim); }

    sql += ` ORDER BY c.data_hora DESC LIMIT 200`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
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
      medico_id, especialidade_id, data_hora, tipo = 'presencial', motivo,
    } = req.body;

    // Verificar conflito de horário
    const [conflito] = await pool.execute(
      `SELECT id FROM consultas WHERE medico_id = ? AND data_hora = ? AND estado NOT IN ('cancelada','falta')`,
      [medico_id, data_hora]
    );
    if (conflito.length) {
      return res.status(409).json({ erro: 'Este horário já está ocupado. Por favor, escolha outro.' });
    }

    // Criar ou encontrar paciente (pelo telefone)
    let pacienteId;
    const [pacExiste] = await pool.execute(
      `SELECT id FROM pacientes WHERE telefone = ?`, [paciente_telefone]
    );
    if (pacExiste.length) {
      pacienteId = pacExiste[0].id;
      // Actualizar dados se necessário
      await pool.execute(
        `UPDATE pacientes SET nome=?, email=?, data_nascimento=?, bi=? WHERE id=?`,
        [paciente_nome, paciente_email || null, paciente_nascimento || null, paciente_bi || null, pacienteId]
      );
    } else {
      const [r] = await pool.execute(
        `INSERT INTO pacientes (nome, email, telefone, data_nascimento, bi) VALUES (?,?,?,?,?)`,
        [paciente_nome, paciente_email || null, paciente_telefone, paciente_nascimento || null, paciente_bi || null]
      );
      pacienteId = r.insertId;
    }

    // Criar consulta
    const [result] = await pool.execute(
      `INSERT INTO consultas (paciente_id, medico_id, especialidade_id, data_hora, tipo, motivo, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pendente')`,
      [pacienteId, medico_id, especialidade_id, data_hora, tipo, motivo || null]
    );

    const consultaId = result.insertId;

    // Enviar email de confirmação
    if (paciente_email) {
      try {
        const [[med]] = await pool.execute(`SELECT CONCAT(titulo,' ',nome) AS nome FROM medicos WHERE id=?`, [medico_id]);
        const [[esp]] = await pool.execute(`SELECT nome FROM especialidades WHERE id=?`, [especialidade_id]);
        const htmlEmail = emailConfirmacaoConsulta(
          { nome: paciente_nome },
          { data_hora, tipo },
          med?.nome || 'Médico',
          esp?.nome || 'Especialidade'
        );
        await enviarEmail({ para: paciente_email, assunto: 'Confirmação de Consulta — Hospital Vida Saudável', html: htmlEmail });
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

// DELETE /api/consultas/:id  (admin ou próprio paciente com token)
async function cancelar(req, res, next) {
  try {
    await pool.execute(
      `UPDATE consultas SET estado = 'cancelada' WHERE id = ?`, [req.params.id]
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
