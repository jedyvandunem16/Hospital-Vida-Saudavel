const { pool } = require('../config/database');
const { enviarEmail } = require('../utils/email');

// POST /api/mensagens  (público)
async function enviar(req, res, next) {
  try {
    const { nome, email, telefone, assunto, mensagem } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO mensagens (nome, email, telefone, assunto, mensagem) VALUES (?,?,?,?,?)`,
      [nome, email, telefone || null, assunto || 'Contacto geral', mensagem]
    );

    // Notificar admin por email
    try {
      await enviarEmail({
        para: process.env.EMAIL_USER,
        assunto: `Nova mensagem de contacto: ${assunto}`,
        html: `<p><strong>De:</strong> ${nome} (${email})</p>
               <p><strong>Tel:</strong> ${telefone || '—'}</p>
               <p><strong>Assunto:</strong> ${assunto}</p>
               <hr>
               <p>${mensagem.replace(/\n/g, '<br>')}</p>`,
      });
    } catch (e) { console.warn('Email admin não enviado:', e.message); }

    res.status(201).json({ id: result.insertId, mensagem: 'Mensagem enviada com sucesso!' });
  } catch (err) { next(err); }
}

// GET /api/mensagens  (admin)
async function listar(req, res, next) {
  try {
    const { lida } = req.query;
    let sql = `SELECT * FROM mensagens WHERE 1=1`;
    const params = [];
    if (lida !== undefined) { sql += ` AND lida = ?`; params.push(lida); }
    sql += ` ORDER BY criado_em DESC LIMIT 100`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// PATCH /api/mensagens/:id/lida  (admin)
async function marcarLida(req, res, next) {
  try {
    await pool.execute(`UPDATE mensagens SET lida = 1 WHERE id = ?`, [req.params.id]);
    res.json({ mensagem: 'Marcada como lida.' });
  } catch (err) { next(err); }
}

module.exports = { enviar, listar, marcarLida };
