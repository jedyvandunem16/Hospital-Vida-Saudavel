require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const updates = [
    {
      nome: 'Hospital Psiquiátrico de Luanda',
      foto_url: 'img/Hospital Psiquiátrico de Luanda.jpg',
    },
    {
      nome: 'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo',
      foto_url: 'img/instituto-hematologico-pediatrico.jpg',
    },
  ];

  for (const u of updates) {
    const [r] = await conn.execute(
      'UPDATE hospitais SET foto_url = ? WHERE nome = ?',
      [u.foto_url, u.nome]
    );
    console.log(`✅ [${r.affectedRows} linha(s)] ${u.nome} => ${u.foto_url}`);
  }

  // Confirmação final
  const [rows] = await conn.execute(
    'SELECT nome, foto_url FROM hospitais WHERE nome IN (?, ?)',
    [updates[0].nome, updates[1].nome]
  );
  console.log('\n📸 Confirmação na BD:');
  rows.forEach(r => console.log(`  ${r.nome}\n  => ${r.foto_url}\n`));

  await conn.end();
}

run().catch(console.error);
