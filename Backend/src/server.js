require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');
const routes             = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/validators');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SEGURANÇA ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Rate limit global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { erro: 'Demasiadas requisições. Tente novamente mais tarde.' },
}));

// ── BODY PARSER ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── LOGGING ───────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  hospital: 'Hospital Vida Saudável',
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
║  🏥  Hospital Vida Saudável — API             ║
║  ✅  Servidor em execução na porta ${PORT}       ║
║  📍  http://localhost:${PORT}/api               ║
║  💊  http://localhost:${PORT}/health            ║
╚═══════════════════════════════════════════════╝
    `);
  });
}

iniciar();
