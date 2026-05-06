require('dotenv').config();
const mysql = require('mysql2/promise');

const imageMapping = {
  "Hospital Américo Boavida": "img/Américo Boa VIda.webp",
  "Centro Cardiológico de Angola": "img/Centro Cardiológico de Angola.jpg",
  "Hospital Pediátrico David Bernardino": "img/hospital pediatrico david bernardino.jpeg",
  "Complexo de Doenças Cardio-Pulmonares Cardeal Dom Alexandre do Nascimento": "img/Hospital de doenças cardio pulmunares.webp",
  "Hospital do Prenda": "img/Hospital-do-Prenda-640x280.jpg",
  "Instituto Oftalmológico de Angola (IONA)": "img/Instituto Oftalmológico de Angola.jpeg",
  "Hospital Materno Infantil Dr. Manuel Pedro Azancot de Menezes": "img/Manuel.jpg",
  "Hospital Josina Machel (Maria Pia)": "img/hospital Josina Machel.jpeg",
  "Hospital Geral dos Cajueiros": "img/hospital dos cajueiros.jpeg",
  "Hospital Geral de Cacuaco (Heróis de Kangamba)": "img/hospital geral de cauaco.jpeg",
  "Hospital Municipal do Sambizanga": "img/hospital minicipal do sambizanga.jfif",
  "Hospital Geral de Luanda (HGL)": "img/hospital-geral-de-luanda1.jpg",
  "Hospital Municipal do Cazenga": "img/hospitam municipal do cazenga.jfif",
  "Maternidade Lucrécia Paím": "img/lucrecia paim.png"
};

async function cleanup() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hospital_vida_saudavel'
  });

  console.log('--- Iniciando limpeza e atualização de imagens ---');

  // 1. Remover duplicados
  const duplicates = [
    "Hospital Geral de Luanda",
    "Hospital Josina Machel"
  ];

  for (const name of duplicates) {
    console.log(`Removendo duplicado: ${name}`);
    // Primeiro removemos as relações nas tabelas dependentes (opcional se houver ON DELETE CASCADE, mas por segurança...)
    const [rows] = await conn.query('SELECT id FROM hospitais WHERE nome = ?', [name]);
    if (rows.length > 0) {
        const id = rows[0].id;
        await conn.query('DELETE FROM hospital_especialidades WHERE hospital_id = ?', [id]);
        await conn.query('DELETE FROM hospital_medicos WHERE hospital_id = ?', [id]);
        
        // Verificar se a coluna hospital_id existe antes de apagar consultas
        const [cols] = await conn.query("SHOW COLUMNS FROM consultas LIKE 'hospital_id'");
        if (cols.length > 0) {
          await conn.query('DELETE FROM consultas WHERE hospital_id = ?', [id]);
        }
        
        await conn.query('DELETE FROM hospitais WHERE id = ?', [id]);
    }
  }

  // 2. Atualizar imagens
  for (const [nome, path] of Object.entries(imageMapping)) {
    console.log(`Atualizando imagem para: ${nome} -> ${path}`);
    await conn.query('UPDATE hospitais SET foto_url = ? WHERE nome = ?', [path, nome]);
  }

  // 3. Adicionar hospitais que estão na pasta de imagens mas não no DB (opcional, mas recomendado)
  const newHospitals = [
    {
      nome: 'Hospital Militar',
      municipio: 'Maianga',
      tipo: 'especializado',
      foto_url: 'img/hospital militar.webp',
      descricao: 'Hospital militar de referência em Luanda.'
    },
    {
      nome: 'Hospital Neves Bendinha',
      municipio: 'Kilamba Kiaxi',
      tipo: 'geral',
      foto_url: 'img/hospita neves bendinha.webp',
      descricao: 'Hospital especializado em tratamento de queimados e cuidados gerais.'
    }
  ];

  for (const h of newHospitals) {
    const [exists] = await conn.query('SELECT id FROM hospitais WHERE nome = ?', [h.nome]);
    if (exists.length === 0) {
      console.log(`Adicionando novo hospital: ${h.nome}`);
      await conn.query(
        'INSERT INTO hospitais (nome, municipio, tipo, foto_url, descricao) VALUES (?, ?, ?, ?, ?)',
        [h.nome, h.municipio, h.tipo, h.foto_url, h.descricao]
      );
    }
  }

  console.log('--- Concluído ---');
  await conn.end();
}

cleanup().catch(console.error);
