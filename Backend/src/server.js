require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const net       = require('net');

const { testConnection } = require('./config/database');
const routes             = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/validators');

const app     = express();
let PORT       = Number(process.env.PORT || 3001);
const isProd   = process.env.NODE_ENV === 'production';
const APP_NAME = process.env.APP_NAME || 'Hospital Vida Saudável';
let dbOnline = false;
const frontendDir = path.join(__dirname, '../../Frontend');
const configTemplate = fs.readFileSync(path.join(frontendDir, 'config.js'), 'utf8');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function getAvailablePort(startPort, maxAttempts = 10) {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`Nenhuma porta disponível entre ${startPort} e ${startPort + maxAttempts - 1}`);
}

// ── SEGURANÇA — HELMET ────────────────────────────────────────────────────────
// Deve vir ANTES do CORS para garantir que todos os headers são aplicados.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3001", "http://127.0.0.1:3001"],
      fontSrc:    ["'self'", "https:", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
// Em produção aceita apenas a origem declarada em FRONTEND_URL.
// Em desenvolvimento aceita também localhost:5500 (Live Server).
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  ...(isProd ? [] : ['http://localhost:5500', 'http://127.0.0.1:5500']),
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    // Pedidos sem origin (ex: curl, Postman) só são aceites fora de produção
    if (!origin) {
      return isProd
        ? callback(new Error('Origem não permitida'))
        : callback(null, true);
    }
    if (allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error(`CORS: origem não permitida — ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── RATE LIMIT GLOBAL ────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Demasiadas requisições. Tente novamente mais tarde.' },
}));

// ── BODY PARSER ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── SERVIR FRONTEND (ESTÁTICO) ────────────────────────────────────────────────
// Permite abrir o site através do link do servidor.
app.use(express.static(frontendDir));

app.get('/config.js', (_req, res) => {
  const port = PORT;
  const updatedConfig = configTemplate.replace(
    "API_URL: 'http://localhost:3001/api'",
    `API_URL: 'http://localhost:${port}/api'`
  );
  res.type('application/javascript').send(updatedConfig);
});

// ── LOGGING ───────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: dbOnline ? 'ok' : 'degraded',
  hospital: APP_NAME,
  versao: '1.0.0',
  ambiente: process.env.NODE_ENV || 'development',
  database: dbOnline ? 'online' : 'offline',
  hora: new Date().toISOString(),
}));

// ── ROTAS ─────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── ERROS ─────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── ARRANQUE ──────────────────────────────────────────────────────────────────
async function iniciar() {
  try {
    PORT = await getAvailablePort(PORT);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  dbOnline = await testConnection();
  if (!dbOnline) {
    console.warn('Servidor iniciado em modo degradado: verifique o MySQL e as variaveis DB_* no .env.');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║    ${APP_NAME} — SISTEMA COMPLETO           ║
║    Servidor em execução na porta ${PORT}       ║
║                                               ║
║    👉 SITE (Frontend): http://localhost:${PORT} ║
║    🔗 API:             http://localhost:${PORT}/api ║
╚═══════════════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Porta ${PORT} ja esta em uso. Defina PORT com outro valor ou feche o processo anterior.`);
      process.exit(1);
    }
    throw err;
  });
}

iniciar();
