require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // IDs antigos/duplicados a remover (identificados pelo check anterior)
  // Manter apenas os registos com IDs mais recentes (ON DUPLICATE KEY UPDATE altera a linha existente)
  // Os IDs baixos 6,8,10,12,14 são as entradas "velhas" que ficaram de versões anteriores
  const idsAntigos = [6, 8, 10, 12, 14];
  for (const id of idsAntigos) {
    await conn.execute('DELETE FROM hospitais WHERE id = ?', [id]);
    console.log(`🗑️  Removido hospital id=${id}`);
  }

  const [rows] = await conn.execute('SELECT id, nome FROM hospitais ORDER BY id');
  console.log('\nHospitais finais:');
  rows.forEach(r => console.log(`  [${r.id}] ${r.nome}`));

  await conn.end();
}

run().catch(console.error);
