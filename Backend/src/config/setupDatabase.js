/**
 * Script de configuração da base de dados
 * Cria todas as tabelas e insere dados iniciais
 * Executar com: npm run db:setup
 */

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  // Conectar sem seleccionar DB (para criá-la se não existir)
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    charset:  'utf8mb4',
  });

  const db = process.env.DB_NAME || 'hospital_vida_saudavel';
  console.log(`\n🏥  A configurar base de dados: ${db}\n`);

  // ── Criar base de dados ──────────────────────────────────────────────────
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${db}\``);
  console.log('✅  Base de dados criada/confirmada');

  // ── TABELAS ──────────────────────────────────────────────────────────────

  // Utilizadores (admin, médicos, recepção)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS utilizadores (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      nome          VARCHAR(150) NOT NULL,
      email         VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role          ENUM('admin','medico','recepcao') NOT NULL DEFAULT 'recepcao',
      ativo         TINYINT(1) NOT NULL DEFAULT 1,
      criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela utilizadores');

  // Especialidades
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS especialidades (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      nome      VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT,
      icone     VARCHAR(80),
      cor       VARCHAR(20),
      ativa     TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela especialidades');

  // Médicos
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS medicos (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      utilizador_id    INT UNIQUE,
      especialidade_id INT NOT NULL,
      nome             VARCHAR(150) NOT NULL,
      titulo           VARCHAR(20) DEFAULT 'Dr.',
      bio              TEXT,
      formacao         VARCHAR(200),
      anos_experiencia INT DEFAULT 0,
      foto_url         VARCHAR(255),
      crm              VARCHAR(50),
      ativo            TINYINT(1) NOT NULL DEFAULT 1,
      criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utilizador_id)    REFERENCES utilizadores(id) ON DELETE SET NULL,
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela medicos');

  // Disponibilidade dos médicos (dias e horas)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS disponibilidade (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      medico_id   INT NOT NULL,
      dia_semana  TINYINT NOT NULL COMMENT '0=Dom,1=Seg,...,6=Sab',
      hora_inicio TIME NOT NULL,
      hora_fim    TIME NOT NULL,
      ativo       TINYINT(1) NOT NULL DEFAULT 1,
      FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela disponibilidade');

  // Pacientes
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      nome            VARCHAR(150) NOT NULL,
      email           VARCHAR(150),
      telefone        VARCHAR(30) NOT NULL,
      data_nascimento DATE,
      genero          ENUM('masculino','feminino','outro'),
      bi              VARCHAR(50),
      morada          VARCHAR(255),
      notas           TEXT,
      criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela pacientes');

  // Consultas / Marcações
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS consultas (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      paciente_id      INT NOT NULL,
      medico_id        INT NOT NULL,
      especialidade_id INT NOT NULL,
      data_hora        DATETIME NOT NULL,
      duracao_min      INT NOT NULL DEFAULT 30,
      estado           ENUM('pendente','confirmada','concluida','cancelada','falta') NOT NULL DEFAULT 'pendente',
      tipo             ENUM('presencial','online') NOT NULL DEFAULT 'presencial',
      motivo           TEXT,
      notas_medico     TEXT,
      criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id)      REFERENCES pacientes(id),
      FOREIGN KEY (medico_id)        REFERENCES medicos(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela consultas');

  // Mensagens de contacto
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mensagens (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nome        VARCHAR(150) NOT NULL,
      email       VARCHAR(150) NOT NULL,
      telefone    VARCHAR(30),
      assunto     VARCHAR(100),
      mensagem    TEXT NOT NULL,
      lida        TINYINT(1) NOT NULL DEFAULT 0,
      respondida  TINYINT(1) NOT NULL DEFAULT 0,
      criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela mensagens');

  // Logs de actividade (auditoria)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS logs_actividade (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      utilizador_id  INT,
      acao           VARCHAR(100) NOT NULL,
      tabela         VARCHAR(80),
      registo_id     INT,
      detalhes       JSON,
      ip             VARCHAR(45),
      criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela logs_actividade');

  // ── DADOS INICIAIS ───────────────────────────────────────────────────────

  // Especialidades
  const especialidades = [
    ['Cardiologia',   'Diagnóstico e tratamento de doenças cardiovasculares', 'fa-heart-pulse',    '#e53935'],
    ['Pediatria',     'Cuidado integral de crianças e adolescentes',          'fa-baby',           '#f9a825'],
    ['Clínica Geral', 'Medicina geral e acompanhamento de doenças crónicas',  'fa-stethoscope',    '#1565c0'],
    ['Urgência',      'Atendimento de urgência 24h por dia',                  'fa-truck-medical',  '#00897b'],
    ['Ortopedia',     'Tratamento do sistema músculo-esquelético',            'fa-bone',           '#6d4c41'],
    ['Neurologia',    'Doenças do sistema nervoso central e periférico',      'fa-brain',          '#7b1fa2'],
    ['Laboratório',   'Análises clínicas e diagnóstico laboratorial',         'fa-flask',          '#0277bd'],
    ['Dermatologia',  'Doenças da pele, cabelo e unhas',                      'fa-person',         '#f06292'],
  ];

  for (const [nome, desc, icone, cor] of especialidades) {
    await conn.execute(
      `INSERT IGNORE INTO especialidades (nome, descricao, icone, cor) VALUES (?, ?, ?, ?)`,
      [nome, desc, icone, cor]
    );
  }
  console.log('✅  Especialidades inseridas');

  // Admin padrão
  const adminEmail = process.env.ADMIN_EMAIL    || 'admin@vidasaudavel.co.ao';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminNome  = process.env.ADMIN_NOME     || 'Administrador';
  const hash       = await bcrypt.hash(adminPass, 12);

  await conn.execute(
    `INSERT IGNORE INTO utilizadores (nome, email, password_hash, role) VALUES (?, ?, ?, 'admin')`,
    [adminNome, adminEmail, hash]
  );
  console.log(`✅  Admin criado: ${adminEmail}`);

  // Médicos de exemplo
  const medicosData = [
    { nome: 'Dr. João Silva',   titulo: 'Dr.',  esp: 'Cardiologia',   bio: 'Especialista em cardiologia intervencionista.',          formacao: 'Universidade de Lisboa',  anos: 15, foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80' },
    { nome: 'Dra. Ana Costa',   titulo: 'Dra.', esp: 'Pediatria',     bio: 'Pediatra dedicada ao cuidado integral das crianças.',    formacao: 'Universidade do Porto',   anos: 12, foto: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80' },
    { nome: 'Dr. Pedro Santos', titulo: 'Dr.',  esp: 'Clínica Geral', bio: 'Médico generalista com foco em medicina preventiva.',    formacao: 'FMUAN, Angola',           anos: 10, foto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80' },
    { nome: 'Dr. Manuel Lopes', titulo: 'Dr.',  esp: 'Ortopedia',     bio: 'Cirurgião ortopédico especialista em coluna vertebral.', formacao: 'Universidade de Coimbra', anos: 18, foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80' },
    { nome: 'Dra. Sofia Neves', titulo: 'Dra.', esp: 'Neurologia',    bio: 'Neurologista clínica e neurofisiologista.',              formacao: 'Universidade de Barcelona', anos: 14, foto: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80' },
  ];

  for (const m of medicosData) {
    const [[esp]] = await conn.execute(`SELECT id FROM especialidades WHERE nome = ?`, [m.esp]);
    if (esp) {
      await conn.execute(
        `INSERT IGNORE INTO medicos (especialidade_id, nome, titulo, bio, formacao, anos_experiencia, foto_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [esp.id, m.nome, m.titulo, m.bio, m.formacao, m.anos, m.foto]
      );
    }
  }
  console.log('✅  Médicos de exemplo inseridos');

  // Disponibilidade padrão (Seg-Sex 8h-17h)
  const [[{ max_id }]] = await conn.execute(`SELECT MAX(id) as max_id FROM medicos`);
  if (max_id) {
    for (let medicoId = 1; medicoId <= max_id; medicoId++) {
      for (let dia = 1; dia <= 5; dia++) { // Segunda a Sexta
        await conn.execute(
          `INSERT IGNORE INTO disponibilidade (medico_id, dia_semana, hora_inicio, hora_fim)
           VALUES (?, ?, '08:00', '17:00')`,
          [medicoId, dia]
        );
      }
    }
  }
  console.log('✅  Disponibilidade padrão inserida');

  await conn.end();

  console.log(`
╔══════════════════════════════════════════════╗
║  ✅  Base de dados configurada com sucesso!  ║
║                                              ║
║  Admin: ${adminEmail.padEnd(36)}║
║  Pass:  ${adminPass.padEnd(36)}║
╚══════════════════════════════════════════════╝
  `);
}

setup().catch(err => {
  console.error('❌  Erro no setup:', err.message);
  process.exit(1);
});
