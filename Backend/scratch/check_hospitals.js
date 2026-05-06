require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.execute(
    'SELECT id, nome, foto_url FROM hospitais ORDER BY id'
  );
  console.log('\nHospitais na BD:');
  rows.forEach(r => console.log(`  [${r.id}] ${r.nome} => ${r.foto_url}`));

  const [esps] = await conn.execute(
    "SELECT id, nome FROM especialidades WHERE nome IN ('Psiquiatria','Hematologia')"
  );
  console.log('\nEspecialidades relevantes:');
  esps.forEach(e => console.log(`  [${e.id}] ${e.nome}`));

  await conn.end();
}

run().catch(console.error);
