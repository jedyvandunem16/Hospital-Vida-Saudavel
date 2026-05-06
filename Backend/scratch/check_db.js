const { pool } = require('../src/config/database');

async function check() {
  try {
    const [rows] = await pool.query('SELECT id, nome, foto_url FROM hospitais');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
