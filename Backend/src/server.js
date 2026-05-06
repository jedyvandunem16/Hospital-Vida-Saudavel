require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const { testConnection } = require('./config/database');
const routes             = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/validators');

const app     = express();
const PORT    = process.env.PORT || 3000;
const isProd  = process.env.NODE_ENV === 'production';
const APP_NAME = process.env.APP_NAME || 'Hospital Vida Saudável';

// ── SEGURANÇA — HELMET ────────────────────────────────────────────────────────
// Deve vir ANTES do CORS para garantir que todos os headers são aplicados.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://127.0.0.1:3000"],
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
app.use(express.static(path.join(__dirname, '../../Frontend')));

// ── LOGGING ───────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  hospital: APP_NAME,
  versao: '1.0.0',
  ambiente: process.env.NODE_ENV || 'development',
  hora: new Date().toISOString(),
}));

// ── ROTAS ─────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── ERROS ─────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── ARRANQUE ──────────────────────────────────────────────────────────────────
async function iniciar() {
  await testConnection();
  app.listen(PORT, () => {
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
}

iniciar();