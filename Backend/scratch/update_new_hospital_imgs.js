require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Atualizar imagens dos dois novos hospitais com fotos reais da pasta img
  const updates = [
    {
      nome: 'Hospital Psiquiátrico de Luanda',
      // Usar imagem de ambiente hospitalar geral
      foto_url: 'img/principal.jfif',
    },
    {
      nome: 'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo',
      // Usar imagem de pediatria (adequada para hospital infantil)
      foto_url: 'img/pediatria.avif',
    },
  ];

  for (const u of updates) {
    await conn.execute(
      'UPDATE hospitais SET foto_url = ? WHERE nome = ?',
      [u.foto_url, u.nome]
    );
    console.log(`✅ ${u.nome} => ${u.foto_url}`);
  }

  // Verificação final
  const [rows] = await conn.execute(
    'SELECT nome, foto_url FROM hospitais WHERE nome IN (?, ?)',
    [updates[0].nome, updates[1].nome]
  );
  console.log('\nVerificação:');
  rows.forEach(r => console.log(`  ${r.nome} => ${r.foto_url}`));

  await conn.end();
}

run().catch(console.error);
