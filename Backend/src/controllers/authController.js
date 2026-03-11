const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../config/database');

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      `SELECT id, nome, email, password_hash, role, ativo FROM utilizadores WHERE email = ?`,
      [email]
    );

    const user = rows[0];
    if (!user || !user.ativo) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      utilizador: { id: user.id, nome: user.nome, email: user.email, role: user.role },
    });
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nome, email, role, criado_em FROM utilizadores WHERE id = ?`,
      [req.utilizador.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /api/auth/utilizadores  (admin only)
async function criarUtilizador(req, res, next) {
  try {
    const { nome, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO utilizadores (nome, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [nome, email, hash, role || 'recepcao']
    );

    res.status(201).json({ id: result.insertId, nome, email, role: role || 'recepcao' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Email já registado.' });
    next(err);
  }
}

// PUT /api/auth/password
async function alterarPassword(req, res, next) {
  try {
    const { password_atual, password_nova } = req.body;
    const [rows] = await pool.execute(
      `SELECT password_hash FROM utilizadores WHERE id = ?`, [req.utilizador.id]
    );
    const ok = await bcrypt.compare(password_atual, rows[0].password_hash);
    if (!ok) return res.status(401).json({ erro: 'Password actual incorrecta.' });

    const hash = await bcrypt.hash(password_nova, 12);
    await pool.execute(`UPDATE utilizadores SET password_hash = ? WHERE id = ?`, [hash, req.utilizador.id]);
    res.json({ mensagem: 'Password alterada com sucesso.' });
  } catch (err) { next(err); }
}

module.exports = { login, me, criarUtilizador, alterarPassword };
