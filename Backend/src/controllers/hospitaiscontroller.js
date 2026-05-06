/**
 * hospitaisController.js
 * Gestão de hospitais públicos de Luanda
 */
/**
 * hospitaisController.js
 * Gestão de hospitais públicos de Luanda
 */
const { pool } = require('../config/database');

// GET /api/hospitais
async function listar(req, res, next) {
  try {
    const { municipio, tipo, especialidade } = req.query;

    let sql = `
      SELECT h.id, h.nome, h.municipio, h.tipo, h.morada, h.telefone,
             h.latitude, h.longitude, h.foto_url, h.descricao,
             GROUP_CONCAT(e.id   ORDER BY e.nome SEPARATOR ',') AS esp_ids,
             GROUP_CONCAT(e.nome ORDER BY e.nome SEPARATOR ',') AS esp_nomes,
             GROUP_CONCAT(e.icone ORDER BY e.nome SEPARATOR ',') AS esp_icones,
             GROUP_CONCAT(e.cor  ORDER BY e.nome SEPARATOR ',') AS esp_cores
      FROM hospitais h
      LEFT JOIN hospital_especialidades he ON h.id = he.hospital_id
      LEFT JOIN especialidades e           ON he.especialidade_id = e.id AND e.ativa = 1
      WHERE h.ativo = 1
    `;
    const params = [];

    if (municipio)    { sql += ` AND h.municipio = ?`;       params.push(municipio); }
    if (tipo)         { sql += ` AND h.tipo = ?`;            params.push(tipo); }
    if (especialidade){ sql += ` AND e.nome LIKE ?`;         params.push(`%${especialidade}%`); }

    sql += ` GROUP BY h.id ORDER BY h.nome ASC`;

    const [rows] = await pool.execute(sql, params);

    // Formatar especialidades como array
    const hospitais = rows.map(h => ({
      ...h,
      especialidades: h.esp_ids
        ? h.esp_ids.split(',').map((id, i) => ({
            id:    parseInt(id),
            nome:  h.esp_nomes.split(',')[i],
            icone: h.esp_icones?.split(',')[i] || 'fa-stethoscope',
            cor:   h.esp_cores?.split(',')[i]  || '#1565c0',
          }))
        : [],
      esp_ids: undefined, esp_nomes: undefined,
      esp_icones: undefined, esp_cores: undefined,
    }));

    res.json(hospitais);
  } catch (err) { next(err); }
}

// GET /api/hospitais/:id
async function obter(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT h.*,
             GROUP_CONCAT(e.id   ORDER BY e.nome SEPARATOR ',') AS esp_ids,
             GROUP_CONCAT(e.nome ORDER BY e.nome SEPARATOR ',') AS esp_nomes,
             GROUP_CONCAT(e.icone ORDER BY e.nome SEPARATOR ',') AS esp_icones,
             GROUP_CONCAT(e.cor  ORDER BY e.nome SEPARATOR ',') AS esp_cores
      FROM hospitais h
      LEFT JOIN hospital_especialidades he ON h.id = he.hospital_id
      LEFT JOIN especialidades e           ON he.especialidade_id = e.id AND e.ativa = 1
      WHERE h.id = ? AND h.ativo = 1
      GROUP BY h.id
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ erro: 'Hospital não encontrado.' });

    const h = rows[0];
    res.json({
      ...h,
      especialidades: h.esp_ids
        ? h.esp_ids.split(',').map((id, i) => ({
            id:    parseInt(id),
            nome:  h.esp_nomes.split(',')[i],
            icone: h.esp_icones?.split(',')[i] || 'fa-stethoscope',
            cor:   h.esp_cores?.split(',')[i]  || '#1565c0',
          }))
        : [],
      esp_ids: undefined, esp_nomes: undefined,
      esp_icones: undefined, esp_cores: undefined,
    });
  } catch (err) { next(err); }
}

// GET /api/hospitais/:id/especialidades
async function especialidades(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT e.id, e.nome, e.descricao, e.icone, e.cor
      FROM especialidades e
      JOIN hospital_especialidades he ON e.id = he.especialidade_id
      WHERE he.hospital_id = ? AND e.ativa = 1
      ORDER BY e.nome
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/hospitais/:id/medicos
async function medicos(req, res, next) {
  try {
    const { especialidade_id } = req.query;
    let sql = `
      SELECT m.id, m.nome, m.titulo, m.bio, m.anos_experiencia, m.foto_url,
             e.nome AS especialidade, e.id AS especialidade_id
      FROM medicos m
      JOIN especialidades e ON m.especialidade_id = e.id
      JOIN hospital_medicos hm ON m.id = hm.medico_id
      WHERE hm.hospital_id = ? AND m.ativo = 1
    `;
    const params = [req.params.id];
    if (especialidade_id) { sql += ` AND m.especialidade_id = ?`; params.push(especialidade_id); }
    sql += ` ORDER BY m.nome`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/hospitais  (admin)
async function criar(req, res, next) {
  try {
    const { nome, municipio, tipo, morada, telefone, latitude, longitude, foto_url, descricao, especialidade_ids } = req.body;
    const [r] = await pool.execute(
      `INSERT INTO hospitais (nome, municipio, tipo, morada, telefone, latitude, longitude, foto_url, descricao)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [nome, municipio, tipo || 'geral', morada || null, telefone || null,
       latitude || null, longitude || null, foto_url || null, descricao || null]
    );
    const hospitalId = r.insertId;

    if (especialidade_ids?.length) {
      for (const eid of especialidade_ids) {
        await pool.execute(
          `INSERT IGNORE INTO hospital_especialidades (hospital_id, especialidade_id) VALUES (?,?)`,
          [hospitalId, eid]
        );
      }
    }
    res.status(201).json({ id: hospitalId, mensagem: 'Hospital criado com sucesso.' });
  } catch (err) { next(err); }
}

// PUT /api/hospitais/:id  (admin)
async function atualizar(req, res, next) {
  try {
    const { nome, municipio, tipo, morada, telefone, foto_url, descricao, especialidade_ids } = req.body;
    await pool.execute(
      `UPDATE hospitais SET nome=?, municipio=?, tipo=?, morada=?, telefone=?, foto_url=?, descricao=? WHERE id=?`,
      [nome, municipio, tipo, morada || null, telefone || null, foto_url || null, descricao || null, req.params.id]
    );
    if (especialidade_ids) {
      await pool.execute(`DELETE FROM hospital_especialidades WHERE hospital_id = ?`, [req.params.id]);
      for (const eid of especialidade_ids) {
        await pool.execute(
          `INSERT IGNORE INTO hospital_especialidades (hospital_id, especialidade_id) VALUES (?,?)`,
          [req.params.id, eid]
        );
      }
    }
    res.json({ mensagem: 'Hospital atualizado.' });
  } catch (err) { next(err); }
}


// DELETE /api/hospitais/:id  (admin) — soft delete: marca ativo = 0
async function remover(req, res, next) {
  try {
    const [[hospital]] = await pool.execute(
      `SELECT id FROM hospitais WHERE id = ? AND ativo = 1`, [req.params.id]
    );
    if (!hospital) {
      return res.status(404).json({ erro: 'Hospital não encontrado ou já removido.' });
    }
    await pool.execute(`UPDATE hospitais SET ativo = 0 WHERE id = ?`, [req.params.id]);
    res.json({ mensagem: 'Hospital removido com sucesso.' });
  } catch (err) { next(err); }
}

module.exports = { listar, obter, especialidades, medicos, criar, atualizar, remover };