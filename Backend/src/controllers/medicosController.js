const { pool } = require('../config/database');

const BASE_QUERY = `
  SELECT m.id, m.nome, m.titulo, m.bio, m.formacao, m.anos_experiencia, m.foto_url, m.crm, m.ativo,
         e.id AS especialidade_id, e.nome AS especialidade, e.icone, e.cor
  FROM medicos m
  JOIN especialidades e ON m.especialidade_id = e.id
`;

// GET /api/medicos
async function listar(req, res, next) {
  try {
    const { especialidade, ativo = 1 } = req.query;
    let sql = BASE_QUERY + ` WHERE m.ativo = ?`;
    const params = [ativo];

    if (especialidade) {
      sql += ` AND e.nome = ?`;
      params.push(especialidade);
    }
    sql += ` ORDER BY m.nome`;

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/medicos/:id
async function obter(req, res, next) {
  try {
    const [rows] = await pool.execute(BASE_QUERY + ` WHERE m.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Médico não encontrado.' });

    // Buscar disponibilidade
    const [disp] = await pool.execute(
      `SELECT dia_semana, hora_inicio, hora_fim FROM disponibilidade WHERE medico_id = ? AND ativo = 1 ORDER BY dia_semana`,
      [req.params.id]
    );
    res.json({ ...rows[0], disponibilidade: disp });
  } catch (err) { next(err); }
}

// POST /api/medicos  (admin)
async function criar(req, res, next) {
  try {
    const { nome, titulo, especialidade_id, bio, formacao, anos_experiencia, foto_url, crm } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO medicos (nome, titulo, especialidade_id, bio, formacao, anos_experiencia, foto_url, crm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, titulo || 'Dr.', especialidade_id, bio, formacao, anos_experiencia || 0, foto_url, crm]
    );
    res.status(201).json({ id: result.insertId, nome });
  } catch (err) { next(err); }
}

// PUT /api/medicos/:id  (admin)
async function atualizar(req, res, next) {
  try {
    const { nome, titulo, especialidade_id, bio, formacao, anos_experiencia, foto_url, crm, ativo } = req.body;
    await pool.execute(
      `UPDATE medicos SET nome=?, titulo=?, especialidade_id=?, bio=?, formacao=?,
       anos_experiencia=?, foto_url=?, crm=?, ativo=? WHERE id=?`,
      [nome, titulo, especialidade_id, bio, formacao, anos_experiencia, foto_url, crm, ativo ?? 1, req.params.id]
    );
    res.json({ mensagem: 'Médico atualizado.' });
  } catch (err) { next(err); }
}

// DELETE /api/medicos/:id  (admin — soft delete)
async function remover(req, res, next) {
  try {
    await pool.execute(`UPDATE medicos SET ativo = 0 WHERE id = ?`, [req.params.id]);
    res.json({ mensagem: 'Médico desativado.' });
  } catch (err) { next(err); }
}

// GET /api/medicos/:id/disponibilidade?data=YYYY-MM-DD
async function disponibilidade(req, res, next) {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ erro: 'Parâmetro data obrigatório (YYYY-MM-DD).' });

    const diaSemana = new Date(data + 'T00:00:00').getDay();

    const [disp] = await pool.execute(
      `SELECT hora_inicio, hora_fim FROM disponibilidade
       WHERE medico_id = ? AND dia_semana = ? AND ativo = 1`,
      [req.params.id, diaSemana]
    );

    if (!disp.length) return res.json({ horarios: [] });

    // Gerar slots de 30 min e verificar os já ocupados
    const { hora_inicio, hora_fim } = disp[0];
    const [ocupados] = await pool.execute(
      `SELECT TIME(data_hora) AS hora FROM consultas
       WHERE medico_id = ? AND DATE(data_hora) = ? AND estado NOT IN ('cancelada','falta')`,
      [req.params.id, data]
    );
    const horasOcupadas = new Set(ocupados.map(r => r.hora.slice(0, 5)));

    const slots = [];
    let [h, m] = hora_inicio.split(':').map(Number);
    const [hFim, mFim] = hora_fim.split(':').map(Number);
    while (h * 60 + m < hFim * 60 + mFim) {
      const slot = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      slots.push({ hora: slot, disponivel: !horasOcupadas.has(slot) });
      m += 30; if (m >= 60) { h++; m -= 60; }
    }

    res.json({ data, horarios: slots });
  } catch (err) { next(err); }
}

module.exports = { listar, obter, criar, atualizar, remover, disponibilidade };
