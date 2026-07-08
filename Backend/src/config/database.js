const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'hospital_vida_saudavel',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+01:00',  // Angola UTC+1
});

// Testar conexão ao arrancar
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL conectado com sucesso');
    conn.release();
    return true;
  } catch (err) {
    console.error('❌  Erro ao conectar ao MySQL:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
