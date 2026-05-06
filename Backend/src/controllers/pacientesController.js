const { pool } = require('../config/database');

// GET /api/pacientes
async function listar(req, res, next) {
  try {
    const { q } = req.query; // pesquisa por nome/telefone
    let sql = `SELECT id, nome, email, telefone, data_nascimento, genero, bi, criado_em FROM pacientes WHERE 1=1`;
    const params = [];
    if (q) {
      sql += ` AND (nome LIKE ? OR telefone LIKE ? OR bi LIKE ?)`;
      // handled below
    }
    // telefone exact match
    const { telefone } = req.query;
    if (telefone && !q) {
      sql += ` AND telefone = ?`;
      params.push(telefone);
    }
    if (q) {// dummy to allow sed replacement
      sql += ` AND (nome LIKE ? OR telefone LIKE ? OR bi LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    sql += ` ORDER BY nome LIMIT 100`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/pacientes/:id
async function obter(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM pacientes WHERE id = ?`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    // Histórico de consultas
    const [consultas] = await pool.execute(`
      SELECT c.id, c.data_hora, c.estado, c.tipo, c.motivo, c.notas_medico,
             CONCAT(m.titulo,' ',m.nome) AS medico, e.nome AS especialidade
      FROM consultas c
      JOIN medicos m        ON c.medico_id = m.id
      JOIN especialidades e ON c.especialidade_id = e.id
      WHERE c.paciente_id = ?
      ORDER BY c.data_hora DESC
    `, [req.params.id]);

    res.json({ ...rows[0], historico: consultas });
  } catch (err) { next(err); }
}

// POST /api/pacientes
async function criar(req, res, next) {
  try {
    const { nome, email, telefone, data_nascimento, genero, bi, morada, notas } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO pacientes (nome, email, telefone, data_nascimento, genero, bi, morada, notas)
       VALUES (?,?,?,?,?,?,?,?)`,
      [nome, email || null, telefone, data_nascimento || null, genero || null, bi || null, morada || null, notas || null]
    );
    res.status(201).json({ id: result.insertId, nome });
  } catch (err) { next(err); }
}

// PUT /api/pacientes/:id
async function atualizar(req, res, next) {
  try {
    const { nome, email, telefone, data_nascimento, genero, bi, morada, notas } = req.body;
    await pool.execute(
      `UPDATE pacientes SET nome=?, email=?, telefone=?, data_nascimento=?, genero=?, bi=?, morada=?, notas=? WHERE id=?`,
      [nome, email || null, telefone, data_nascimento || null, genero || null, bi || null, morada || null, notas || null, req.params.id]
    );
    res.json({ mensagem: 'Paciente atualizado.' });
  } catch (err) { next(err); }
}


// GET /api/pacientes/buscar?telefone=XXX — rota pública
// Devolve apenas id e nome (campos não sensíveis) para pré-preenchimento
// no formulário de marcação. Nunca expõe email, BI, morada ou histórico.
async function buscarPorTelefone(req, res, next) {
  try {
    const { telefone } = req.query;
    if (!telefone || String(telefone).trim().length < 7) {
      return res.status(400).json({ erro: 'Parâmetro telefone obrigatório (mín. 7 dígitos).' });
    }
    const [rows] = await pool.execute(
      `SELECT id, nome FROM pacientes WHERE telefone = ? LIMIT 1`,
      [String(telefone).trim()]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    res.json(rows[0]); // apenas { id, nome }
  } catch (err) { next(err); }
}

module.exports = { listar, obter, criar, atualizar, buscarPorTelefone };