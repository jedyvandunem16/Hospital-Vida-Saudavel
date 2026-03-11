const { pool } = require('../config/database');

// GET /api/especialidades  (público)
async function listar(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nome, descricao, icone, cor FROM especialidades WHERE ativa = 1 ORDER BY nome`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/especialidades  (admin)
async function criar(req, res, next) {
  try {
    const { nome, descricao, icone, cor } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO especialidades (nome, descricao, icone, cor) VALUES (?,?,?,?)`,
      [nome, descricao || null, icone || null, cor || null]
    );
    res.status(201).json({ id: result.insertId, nome });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Especialidade já existe.' });
    next(err);
  }
}

module.exports = { listar, criar };
