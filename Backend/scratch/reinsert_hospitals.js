require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const hospitais = [
    {
      nome: 'Hospital Geral de Viana',
      municipio: 'Viana', tipo: 'geral',
      morada: 'Sede do Município de Viana, Luanda',
      telefone: '+244 222 395 000',
      foto_url: 'img/hospital geral de viana.jpeg',
      descricao: 'Hospital geral atendendo a sede do município de Viana.',
      especialidades: ['Cirurgia Geral', 'Ortopedia', 'Pediatria', 'Medicina Interna'],
    },
    {
      nome: 'Hospital Municipal de Viana',
      municipio: 'Viana', tipo: 'geral',
      morada: 'Estrada de Catete, Viana, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/Hospital Municipal de Viana.jfif',
      descricao: 'Unidade hospitalar municipal focada em cuidados primários e urgências para a população de Viana.',
      especialidades: ['Medicina Geral', 'Pediatria', 'Urgência'],
    },
    {
      nome: 'Hospital Municipal do Sambizanga',
      municipio: 'Sambizanga', tipo: 'geral',
      morada: 'Bairro Sambizanga, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/hospital minicipal do sambizanga.jfif',
      descricao: 'Hospital municipal que serve a comunidade do Sambizanga.',
      especialidades: ['Medicina Geral', 'Pediatria', 'Maternidade'],
    },
    {
      nome: 'Hospital Municipal do Cazenga',
      municipio: 'Cazenga', tipo: 'geral',
      morada: 'Bairro do Cazenga, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/hospitam municipal do cazenga.jfif',
      descricao: 'Unidade de saúde municipal dedicada ao atendimento da vasta população do Cazenga.',
      especialidades: ['Medicina Geral', 'Pediatria', 'Urgência'],
    },
  ];

  for (const h of hospitais) {
    // Insert if doesn't exist (IGNORE to avoid duplicate)
    const [r] = await conn.execute(
      `INSERT IGNORE INTO hospitais (nome, municipio, tipo, morada, telefone, foto_url, descricao) VALUES (?,?,?,?,?,?,?)`,
      [h.nome, h.municipio, h.tipo, h.morada, h.telefone, h.foto_url, h.descricao]
    );

    let hospitalId = r.insertId;
    if (!hospitalId) {
      const [rows] = await conn.execute('SELECT id FROM hospitais WHERE nome = ?', [h.nome]);
      hospitalId = rows[0]?.id;
    }

    for (const espNome of h.especialidades) {
      const [eRows] = await conn.execute('SELECT id FROM especialidades WHERE nome = ?', [espNome]);
      if (eRows[0]) {
        await conn.execute(
          'INSERT IGNORE INTO hospital_especialidades (hospital_id, especialidade_id) VALUES (?,?)',
          [hospitalId, eRows[0].id]
        );
      }
    }
    console.log(`✅ ${h.nome} (id=${hospitalId})`);
  }

  await conn.end();
}

run().catch(console.error);
