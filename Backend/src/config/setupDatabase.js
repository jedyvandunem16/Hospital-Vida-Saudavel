/**
 * Script de configuração da base de dados
 * Cria todas as tabelas e insere dados iniciais
 * Executar com: npm run db:setup
 */

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    charset:  'utf8mb4',
  });

  const db = process.env.DB_NAME || 'hospital_vida_saudavel';
  console.log(`\n🏥  A configurar base de dados: ${db}\n`);

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${db}\``);
  console.log('✅  Base de dados criada/confirmada');

  // ── TABELAS ──────────────────────────────────────────────────────────────

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

  // ── HOSPITAIS (NOVA TABELA) ───────────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS hospitais (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nome        VARCHAR(200) NOT NULL,
      municipio   VARCHAR(100) NOT NULL,
      tipo        ENUM('geral','especializado','referencia','maternidade','pediatrico') NOT NULL DEFAULT 'geral',
      morada      VARCHAR(255),
      telefone    VARCHAR(30),
      latitude    DECIMAL(10,8),
      longitude   DECIMAL(11,8),
      foto_url    VARCHAR(255),
      descricao   TEXT,
      ativo       TINYINT(1) NOT NULL DEFAULT 1,
      criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (nome)
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela hospitais');

  // ── RELAÇÃO HOSPITAL ↔ ESPECIALIDADES ────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS hospital_especialidades (
      hospital_id      INT NOT NULL,
      especialidade_id INT NOT NULL,
      PRIMARY KEY (hospital_id, especialidade_id),
      FOREIGN KEY (hospital_id)      REFERENCES hospitais(id)      ON DELETE CASCADE,
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela hospital_especialidades');

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
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id),
      UNIQUE (nome)
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela medicos');

  // ── RELAÇÃO HOSPITAL ↔ MÉDICOS ───────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS hospital_medicos (
      hospital_id INT NOT NULL,
      medico_id   INT NOT NULL,
      PRIMARY KEY (hospital_id, medico_id),
      FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE CASCADE,
      FOREIGN KEY (medico_id)   REFERENCES medicos(id)   ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela hospital_medicos');

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

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS consultas (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      paciente_id      INT NOT NULL,
      medico_id        INT NOT NULL,
      especialidade_id INT NOT NULL,
      hospital_id      INT,
      data_hora        DATETIME NOT NULL,
      duracao_min      INT NOT NULL DEFAULT 30,
      estado           ENUM('pendente','confirmada','concluida','cancelada','falta') NOT NULL DEFAULT 'pendente',
      tipo             ENUM('presencial','online') NOT NULL DEFAULT 'presencial',
      motivo           TEXT,
      notas_medico     TEXT,
      cancelado_por    INT NULL,
      cancelado_em     DATETIME NULL,
      criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id)      REFERENCES pacientes(id),
      FOREIGN KEY (medico_id)        REFERENCES medicos(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id),
      FOREIGN KEY (hospital_id)      REFERENCES hospitais(id) ON DELETE SET NULL,
      FOREIGN KEY (cancelado_por)    REFERENCES utilizadores(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
  console.log('✅  Tabela consultas');

  // Garantir que a coluna hospital_id existe (caso a tabela tenha sido criada numa versão anterior)
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM consultas LIKE 'hospital_id'");
    if (cols.length === 0) {
      await conn.execute('ALTER TABLE consultas ADD COLUMN hospital_id INT AFTER especialidade_id');
      await conn.execute('ALTER TABLE consultas ADD FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE SET NULL');
      console.log('✅  Coluna hospital_id adicionada à tabela consultas');
    }
  } catch (err) {
    console.warn('⚠️  Aviso ao verificar coluna hospital_id:', err.message);
  }

  try {
    const [canceladoPorCols] = await conn.query("SHOW COLUMNS FROM consultas LIKE 'cancelado_por'");
    if (canceladoPorCols.length === 0) {
      await conn.execute('ALTER TABLE consultas ADD COLUMN cancelado_por INT NULL AFTER notas_medico');
      console.log('✅  Coluna cancelado_por adicionada à tabela consultas');
    }

    const [canceladoEmCols] = await conn.query("SHOW COLUMNS FROM consultas LIKE 'cancelado_em'");
    if (canceladoEmCols.length === 0) {
      await conn.execute('ALTER TABLE consultas ADD COLUMN cancelado_em DATETIME NULL AFTER cancelado_por');
      console.log('✅  Coluna cancelado_em adicionada à tabela consultas');
    }
  } catch (err) {
    console.warn('⚠️  Aviso ao verificar colunas de cancelamento:', err.message);
  }

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

  // ── DADOS INICIAIS ────────────────────────────────────────────────────────

  // Especialidades
  const especialidades = [
    ['Cardiologia',    'Diagnóstico e tratamento de doenças cardiovasculares', 'fa-heart-pulse',   '#e53935'],
    ['Pediatria',      'Cuidado integral de crianças e adolescentes',          'fa-baby',          '#f9a825'],
    ['Clínica Geral',  'Medicina geral e acompanhamento de doenças crónicas',  'fa-stethoscope',   '#1565c0'],
    ['Urgência',       'Atendimento de urgência 24h por dia',                  'fa-truck-medical', '#00897b'],
    ['Ortopedia',      'Tratamento do sistema músculo-esquelético',            'fa-bone',          '#6d4c41'],
    ['Neurologia',     'Doenças do sistema nervoso central e periférico',      'fa-brain',         '#7b1fa2'],
    ['Laboratório',    'Análises clínicas e diagnóstico laboratorial',         'fa-flask',         '#0277bd'],
    ['Dermatologia',   'Doenças da pele, cabelo e unhas',                      'fa-person',        '#f06292'],
    ['Ginecologia',    'Saúde da mulher e sistema reprodutivo feminino',       'fa-venus',         '#e91e63'],
    ['Oftalmologia',   'Doenças dos olhos e saúde visual',                     'fa-eye',           '#00acc1'],
    ['Maternidade',    'Parto, pré-natal e pós-natal',                        'fa-baby-carriage', '#ff7043'],
    ['Cirurgia Geral', 'Cirurgias de média e grande complexidade',             'fa-scalpel',       '#546e7a'],
    ['Cardiovascular e Torácica', 'Cirurgia torácica e doenças cardiovasculares', 'fa-heart-pulse', '#d32f2f'],
    // NEW SPECIALTIES
    ['Endocrinologia', 'Distúrbios hormonais e metabólicos', 'fa-hashtag', '#ff9800'],
    ['Radiologia', 'Diagnóstico por imagem e radioterapia', 'fa-x-ray', '#ff5722'],
    ['Maxilo-Facial', 'Cirurgia da face e cavidade oral', 'fa-face-smile', '#7b1fa2'],
    ['Hematologia', 'Doenças do sangue e órgãos hematopoiéticos', 'fa-droplet', '#c62828'],
    ['Infectologia', 'Doenças infecto-contagiosas', 'fa-virus', '#2e7d32'],
    ['Gastroenterologia', 'Doenças do aparelho digestivo', 'fa-stomach', '#ef6c00'],
    ['Nefrologia', 'Doenças renais e sistema urinário', 'fa-kidneys', '#1565c0'],
    ['Pneumologia', 'Doenças do sistema respiratório', 'fa-lungs', '#0288d1'],
    ['Urologia', 'Doenças do sistema urinário e reprodutor masculino', 'fa-toilet-paper', '#f9a825'],
    ['Otorrinolaringologia', 'Doenças de ouvido, nariz e garganta', 'fa-ear-listen', '#6a1b9a'],
    ['Anestesiologia', 'Controlo da dor e anestesia em cirurgias', 'fa-syringe', '#455a64'],
    ['Medicina Interna', 'Cuidado integral do adulto em ambiente hospitalar', 'fa-hospital-user', '#283593'],
    ['Planeamento Familiar', 'Saúde reprodutiva e métodos contracetivos', 'fa-people-group', '#ad1457'],
    ['Odontologia', 'Saúde oral e tratamentos dentários', 'fa-tooth', '#0097a7'],
    ['Fisioterapia', 'Reabilitação física e motora', 'fa-person-walking', '#2e7d32'],
    ['Psicologia', 'Saúde mental e acompanhamento psicológico', 'fa-brain', '#9c27b0'],
    ['Saúde Materno-Infantil', 'Cuidado integrado de mãe e filho', 'fa-baby-carriage', '#ec407a'],
    ['Neonatologia', 'Cuidados de recém-nascidos de alto risco', 'fa-baby', '#f06292'],
    ['Cirurgia Cardíaca', 'Cirurgias complexas do coração', 'fa-heart-circle-check', '#b71c1c'],
    ['Nutrição', 'Orientação alimentar e dietoterapia', 'fa-apple-whole', '#689f38'],
    ['Medicina Geral', 'Cuidados de saúde primários e preventivos', 'fa-stethoscope', '#1565c0'],
    ['Oncologia Pediátrica', 'Tratamento de cancro em crianças', 'fa-ribbon', '#fbc02d'],
    ['Neurocirurgia', 'Cirurgia do sistema nervoso', 'fa-brain-circuit', '#6a1b9a'],
    ['Psiquiatria', 'Saúde mental e tratamento de transtornos psiquiátricos', 'fa-brain', '#6a1b9a'],
    ['Anemia Falciforme', 'Tratamento de Anemia Falciforme (centro de apoio)', 'fa-droplet', '#c62828'],
    ['Leucemias Agudas e Crónicas', 'Tratamento de leucemias', 'fa-vial-virus', '#d32f2f'],
    ['Linfomas', 'Tratamento de linfomas', 'fa-disease', '#b71c1c'],
    ['Hemofilia', 'Tratamento de hemofilia', 'fa-hand-dots', '#e53935'],
    ['Transplante de Medula Óssea', 'Centro de transplante de medula óssea', 'fa-bone', '#ff5252'],
    ['Psiquiatria Geral', 'Tratamento de esquizofrenia, transtornos bipolares e psicoses', 'fa-brain', '#6a1b9a'],
    ['Psicologia Clínica', 'Apoio psicoterapêutico e avaliações psicológicas', 'fa-head-side-virus', '#8e24aa'],
    ['Toxicodependência', 'Unidade dedicada ao tratamento de vícios e drogas pesadas', 'fa-pills', '#ab47bc'],
    ['Psiquiatria Infantil e Juvenil', 'Atendimento especializado para jovens com quadros de ansiedade e depressão', 'fa-child-reaching', '#9c27b0'],
    ['Fisioterapia Ocupacional', 'Reabilitação e terapia ocupacional', 'fa-hands-holding-child', '#7b1fa2'],

  ];

  for (const [nome, desc, icone, cor] of especialidades) {
    await conn.execute(
      `INSERT IGNORE INTO especialidades (nome, descricao, icone, cor) VALUES (?, ?, ?, ?)`,
      [nome, desc, icone, cor]
    );
  }
  console.log('✅  Especialidades inseridas');

  // ── HOSPITAIS PÚBLICOS DE LUANDA ─────────────────────────────────────────
  // Remover centros que não devem estar na lista pública (ex: Centro Cardiológico)
  await conn.execute('DELETE FROM hospitais WHERE nome = ?', ['Centro Cardiológico de Angola']);

  const hospitaisData = [
    {
      nome: 'Hospital Josina Machel (Maria Pia)',
      municipio: 'Maianga',
      tipo: 'referencia',
      morada: 'Largo Josina Machel, Maianga, Luanda',
      telefone: '+244 222 330 400',
      foto_url: 'img/hospital Josina Machel.jpeg',
      descricao: 'O maior hospital do país e referência em cuidados de alta complexidade.',
      especialidades: ['Cirurgia Geral', 'Cardiovascular e Torácica', 'Maxilo-Facial', 'Neurologia', 'Neurocirurgia', 'Hematologia', 'Infectologia', 'Gastroenterologia', 'Nefrologia', 'Pneumologia', 'Dermatologia', 'Urologia', 'Otorrinolaringologia'],
    },
    {
      nome: 'Hospital do Prenda',
      municipio: 'Maianga',
      tipo: 'especializado',
      morada: 'Rua Comandante Arguelles, Bairro do Prenda, Luanda',
      telefone: '+244 222 321 000',
      foto_url: 'img/Hospital-do-Prenda-640x280.jpg',
      descricao: 'Unidade estratégica da rede de saúde, amplamente reconhecida pelo seu centro de traumas e referência em Cirurgia Geral, Ortopedia e prestação rápida de serviços de urgência para a zona sul.',
      especialidades: ['Cirurgia Geral', 'Ortopedia', 'Clínica Geral', 'Urgência'],
    },
    {
      nome: 'Hospital Américo Boavida',
      municipio: 'Rangel',
      tipo: 'referencia',
      morada: 'Avenida Hoji Ya Henda, Rangel, Luanda',
      telefone: '+244 222 330 400',
      foto_url: 'img/Américo Boa VIda.webp',
      descricao: 'Importante centro hospitalar universitário que alia o atendimento médico ao ensino e investigação. A unidade encontra-se atualmente em fase de expansão e profunda modernização estrutural.',
      especialidades: ['Anestesiologia', 'Cirurgia Geral', 'Ortopedia', 'Urologia', 'Neurocirurgia', 'Pediatria', 'Medicina Interna', 'Cardiologia', 'Dermatologia', 'Gastroenterologia'],
    },
    {
      nome: 'Hospital Geral de Luanda (HGL)',
      municipio: 'Kilamba Kiaxi',
      tipo: 'geral',
      morada: 'Zona do Camama, Luanda',
      telefone: '+244 222 350 000',
      foto_url: 'img/hospital-geral-luanda.jpg',
      descricao: 'Hospital geral com ampla gama de especialidades médicas e cirúrgicas.',
      especialidades: ['Medicina Interna', 'Pediatria', 'Ginecologia', 'Maternidade', 'Planeamento Familiar', 'Cirurgia Geral', 'Ortopedia', 'Cardiologia', 'Neurologia', 'Oftalmologia', 'Odontologia', 'Fisioterapia', 'Psicologia'],
    },
    {
      nome: 'Hospital Materno Infantil Dr. Manuel Pedro Azancot de Menezes',
      municipio: 'Kilamba Kiaxi',
      tipo: 'maternidade',
      morada: 'Camama, Luanda',
      telefone: '+244 222 280 123',
      foto_url: 'img/Hospital Materno Infantil Dr. Manuel Pedro Azancot de Menezes.jpeg',
      descricao: 'Instituição de vanguarda desenhada para a excelência em cuidados da mulher e do recém-nascido, providenciando assistência avançada em neonatologia, ginecologia e acompanhamento pré-natal.',
      especialidades: ['Saúde Materno-Infantil', 'Neonatologia', 'Ginecologia'],
    },
    {
      nome: 'Complexo de Doenças Cardio-Pulmonares Cardeal Dom Alexandre do Nascimento',
      municipio: 'Kilamba Kiaxi',
      tipo: 'especializado',
      morada: 'Avenida Pedro de Castro Van-Dúnem Loy, Camama, Luanda',
      telefone: '+244 222 260 500',
      foto_url: 'img/Hospital de doenças cardio pulmunares.webp',
      descricao: 'Centro hospitalar de referência nacional e internacional com infraestruturas de altíssima tecnologia, especializado no diagnóstico e tratamento cirúrgico avançado de doenças cardiovasculares e pulmonares.',
      especialidades: ['Cardiologia', 'Cirurgia Cardíaca', 'Pneumologia'],
    },
    {
      nome: 'Hospital Geral dos Cajueiros',
      municipio: 'Cazenga',
      tipo: 'geral',
      morada: 'Bairro dos Cajueiros, Cazenga, Luanda',
      telefone: '+244 222 290 700',
      foto_url: 'img/hospital dos cajueiros.jpeg',
      descricao: 'Pilar fundamental de assistência médica no município do Cazenga, destacando-se no atendimento primário e especializado em pediatria, nutrição e serviços gerais, garantindo saúde a milhares de cidadãos.',
      especialidades: ['Pediatria', 'Urologia', 'Otorrinolaringologia', 'Nutrição', 'Medicina Interna', 'Ginecologia', 'Maternidade', 'Medicina Geral'],
    },
    {
      nome: 'Hospital Geral de Cacuaco (Heróis de Kangamba)',
      municipio: 'Cacuaco',
      tipo: 'geral',
      morada: 'Centralidade do Sequele, Cacuaco, Luanda',
      telefone: '+244 222 395 000',
      foto_url: 'img/hospital geral de cauaco.jpeg',
      descricao: 'Atendimento geral com reforço em especialidades e Oncologia Pediátrica.',
      especialidades: ['Medicina Geral', 'Oncologia Pediátrica'],
    },
    {
      nome: 'Hospital Geral de Viana',
      municipio: 'Viana',
      tipo: 'geral',
      morada: 'Sede do Município de Viana, Luanda',
      telefone: '+244 222 395 000',
      foto_url: 'img/hospital geral de viana.jpeg',
      descricao: 'Complexo sanitário de suporte primário e secundário focado no atendimento às enormes demandas demográficas de Viana, garantindo serviços ágeis em medicina interna, pediatria e ortopedia.',
      especialidades: ['Cirurgia Geral', 'Ortopedia', 'Pediatria', 'Medicina Interna'],
    },
    {
      nome: 'Hospital Municipal de Viana',
      municipio: 'Viana',
      tipo: 'geral',
      morada: 'Estrada de Catete, Viana, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/Hospital Municipal de Viana.jfif',
      descricao: 'Unidade central para a resposta primária no município, focada no acolhimento rápido, urgências 24 horas e cuidados essenciais nas valências pediátricas e clínica geral, descongestionando as grandes urgências.',
      especialidades: ['Medicina Geral', 'Pediatria', 'Urgência'],
    },
    {
      nome: 'Hospital Municipal do Sambizanga',
      municipio: 'Sambizanga',
      tipo: 'geral',
      morada: 'Bairro Sambizanga, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/hospital minicipal do sambizanga.jfif',
      descricao: 'Instituição essencial na malha urbana de Luanda, altamente empenhada no acompanhamento à maternidade, urgências pediátricas e cuidados materno-infantis para toda a zona envolvente.',
      especialidades: ['Medicina Geral', 'Pediatria', 'Maternidade'],
    },
    {
      nome: 'Hospital Municipal do Cazenga',
      municipio: 'Cazenga',
      tipo: 'geral',
      morada: 'Bairro do Cazenga, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/hospitam municipal do cazenga.jfif',
      descricao: 'Unidade de saúde municipal dedicada ao atendimento da vasta população do município do Cazenga.',
      especialidades: ['Medicina Geral', 'Pediatria', 'Urgência'],
    },
    {
      nome: 'Hospital Psiquiátrico de Luanda',
      municipio: 'Luanda',
      tipo: 'especializado',
      morada: 'Avenida Hoji Ya Henda, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/Hospital Psiquiátrico de Luanda.jpg',
      descricao: 'A unidade central de saúde mental em Angola, dedicada ao apoio e reabilitação de utentes com transtornos do foro psicológico, através de intervenção clínica e terapias ocupacionais modernas.',
      especialidades: ['Psiquiatria Geral', 'Psicologia Clínica', 'Toxicodependência', 'Neurologia', 'Psiquiatria Infantil e Juvenil', 'Fisioterapia Ocupacional'],
    },
    {
      nome: 'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo',
      municipio: 'Luanda',
      tipo: 'especializado',
      morada: 'Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/instituto-hematologico-pediatrico.jpg',
      descricao: 'Unidade de altíssima diferenciação dedicada ao diagnóstico e tratamento intensivo de doenças hematológicas infantis, pioneira no acompanhamento de anemias falciformes e neoplasias no sangue.',
      especialidades: ['Anemia Falciforme', 'Leucemias Agudas e Crónicas', 'Linfomas', 'Hemofilia', 'Transplante de Medula Óssea'],
    },
    {
      nome: 'Maternidade Lucrécia Paim',
      municipio: 'Maianga',
      tipo: 'maternidade',
      morada: 'Distrito Urbano da Maianga/Ingombota, Luanda',
      telefone: '+244 222 321 856',
      foto_url: 'img/lucrecia paim.png',
      descricao: 'Especializada em Ginecologia e Obstetrícia de alta complexidade.',
      especialidades: ['Ginecologia', 'Maternidade'],
    },
    {
      nome: 'Hospital Pediátrico David Bernardino',
      municipio: 'Maianga',
      tipo: 'pediatrico',
      morada: 'Maianga, Luanda',
      telefone: '+244 222 350 000',
      foto_url: 'img/HOSPITAL-DAVID-BERNARDINO1-696x464-1.jpg',
      descricao: 'A maior e mais importante instituição do país voltada à saúde infantil, garantindo tratamento intensivo e multidisciplinar a crianças, desde a nefrologia pediátrica até ao acompanhamento intensivo.',
      especialidades: ['Pediatria'],
    },
    {
      nome: 'Instituto Oftalmológico de Angola (IONA)',
      municipio: 'Ingombota',
      tipo: 'especializado',
      morada: 'Zona da Ilha de Luanda, Luanda',
      telefone: '+244 222 395 000',
      foto_url: 'img/Instituto Oftalmológico de Angola.jpeg',
      descricao: 'Focado exclusivamente em Oftalmologia.',
      especialidades: ['Oftalmologia'],
    },
    {
      nome: 'Hospital Militar',
      municipio: 'Maianga',
      tipo: 'especializado',
      morada: 'Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/hospital militar.webp',
      descricao: 'Hospital militar de referência em Luanda.',
      especialidades: ['Cirurgia Geral', 'Urgência', 'Medicina Interna'],
    },
    {
      nome: 'Hospital Neves Bendinha',
      municipio: 'Kilamba Kiaxi',
      tipo: 'geral',
      morada: 'Estrada do Golfe, Luanda',
      telefone: '+244 222 000 000',
      foto_url: 'img/hospita neves bendinha.webp',
      descricao: 'Hospital especializado em tratamento de queimados e cuidados gerais.',
      especialidades: ['Cirurgia Geral', 'Urgência', 'Dermatologia'],
    },
  ];

  for (const h of hospitaisData) {
    const [rH] = await conn.execute(
      `INSERT INTO hospitais (nome, municipio, tipo, morada, telefone, foto_url, descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       municipio = VALUES(municipio),
       tipo = VALUES(tipo),
       morada = VALUES(morada),
       telefone = VALUES(telefone),
       foto_url = VALUES(foto_url),
       descricao = VALUES(descricao)`,
      [h.nome, h.municipio, h.tipo, h.morada, h.telefone, h.foto_url, h.descricao]
    );

    let hospitalId = rH.insertId;
    if (!hospitalId) {
      const [[hospitalRow]] = await conn.execute(`SELECT id FROM hospitais WHERE nome = ?`, [h.nome]);
      hospitalId = hospitalRow?.id;
    }

    if (!hospitalId) continue;

    for (const espNome of h.especialidades) {
      const [[esp]] = await conn.execute(`SELECT id FROM especialidades WHERE nome = ?`, [espNome]);
      if (esp) {
        await conn.execute(
          `INSERT IGNORE INTO hospital_especialidades (hospital_id, especialidade_id) VALUES (?, ?)`,
          [hospitalId, esp.id]
        );
      }
    }
  }
  console.log('✅  Hospitais de Luanda inseridos');

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
    { nome: 'Dr. João Silva',    titulo: 'Dr.',  esp: 'Cardiologia',   anos: 15, foto: 'img/medico_4.jpg' },
    { nome: 'Dra. Ana Costa',    titulo: 'Dra.', esp: 'Pediatria',     anos: 12, foto: 'img/medica_1.jpg' },
    { nome: 'Dr. Pedro Santos',  titulo: 'Dr.',  esp: 'Clínica Geral', anos: 10, foto: 'img/medico_5.webp' },
    { nome: 'Dr. Manuel Lopes',  titulo: 'Dr.',  esp: 'Ortopedia',     anos: 18, foto: 'img/medico_9.jpg' },
    { nome: 'Dra. Sofia Neves',  titulo: 'Dra.', esp: 'Neurologia',    anos: 14, foto: 'img/medica_2.jpg' },
    { nome: 'Dra. Carla Mendes', titulo: 'Dra.', esp: 'Ginecologia',   anos: 11, foto: 'img/medica_7.jpg' },
    { nome: 'Dr. Rui Cardoso',   titulo: 'Dr.',  esp: 'Laboratório',   anos: 20, foto: 'img/medico_10.jpg' },
  ];

  for (const m of medicosData) {
    const [[esp]] = await conn.execute(`SELECT id FROM especialidades WHERE nome = ?`, [m.esp]);
    if (esp) {
      await conn.execute(
        `INSERT INTO medicos (especialidade_id, nome, titulo, anos_experiencia, foto_url)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         especialidade_id = VALUES(especialidade_id),
         titulo = VALUES(titulo),
         anos_experiencia = VALUES(anos_experiencia),
         foto_url = VALUES(foto_url)`,
        [esp.id, m.nome, m.titulo, m.anos, m.foto]
      );
    }
  }
  console.log('✅  Médicos inseridos');
  await conn.execute(`DELETE hm FROM hospital_medicos hm JOIN medicos m ON hm.medico_id = m.id`);
  await conn.execute(
    `INSERT IGNORE INTO hospital_medicos (hospital_id, medico_id)
     SELECT he.hospital_id, m.id
     FROM hospital_especialidades he
     JOIN medicos m ON m.especialidade_id = he.especialidade_id
     WHERE m.ativo = 1`
  );
  console.log('✅  Médicos associados aos hospitais');


  // Disponibilidade padrão
  const [[{ max_id }]] = await conn.execute(`SELECT MAX(id) as max_id FROM medicos`);
  if (max_id) {
    for (let mid = 1; mid <= max_id; mid++) {
      for (let dia = 1; dia <= 5; dia++) {
        await conn.execute(
          `INSERT IGNORE INTO disponibilidade (medico_id, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, '08:00', '17:00')`,
          [mid, dia]
        );
      }
    }
  }
  console.log('✅  Disponibilidade inserida');

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
  console.error('❌  Erro no setup:', err.message || err.sqlMessage || err.code || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
