const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { body }   = require('express-validator');
const { autenticar, autorizar } = require('../middleware/auth');
const { validar } = require('../middleware/validators');

const authCtrl         = require('../controllers/authController');
const medicosCtrl      = require('../controllers/medicosController');
const consultasCtrl    = require('../controllers/consultasController');
const pacientesCtrl    = require('../controllers/pacientesController');
const mensagensCtrl    = require('../controllers/mensagensController');
const especialidadesCtrl = require('../controllers/especialidadesController');

const router = express.Router();

// Rate limiter para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { erro: 'Demasiadas tentativas. Tente novamente em 15 minutos.' },
});

// Rate limiter para marcações públicas
const marcacaoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { erro: 'Limite de marcações excedido. Tente mais tarde.' },
});

// ── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', loginLimiter,
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password obrigatória'),
  validar, authCtrl.login
);
router.get('/auth/me', autenticar, authCtrl.me);
router.put('/auth/password', autenticar,
  body('password_atual').notEmpty(),
  body('password_nova').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  validar, authCtrl.alterarPassword
);
router.post('/auth/utilizadores', autenticar, autorizar('admin'),
  body('nome').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['admin','medico','recepcao']),
  validar, authCtrl.criarUtilizador
);

// ── ESPECIALIDADES ────────────────────────────────────────────────────────────
router.get('/especialidades', especialidadesCtrl.listar);
router.post('/especialidades', autenticar, autorizar('admin'),
  body('nome').notEmpty(),
  validar, especialidadesCtrl.criar
);

// ── MÉDICOS ───────────────────────────────────────────────────────────────────
router.get('/medicos', medicosCtrl.listar);
router.get('/medicos/:id', medicosCtrl.obter);
router.get('/medicos/:id/disponibilidade', medicosCtrl.disponibilidade);
router.post('/medicos', autenticar, autorizar('admin'),
  body('nome').notEmpty(),
  body('especialidade_id').isInt(),
  validar, medicosCtrl.criar
);
router.put('/medicos/:id', autenticar, autorizar('admin'), medicosCtrl.atualizar);
router.delete('/medicos/:id', autenticar, autorizar('admin'), medicosCtrl.remover);

// ── CONSULTAS ─────────────────────────────────────────────────────────────────
// Dashboard (antes de :id para não conflituar)
router.get('/consultas/dashboard', autenticar, autorizar('admin','recepcao'), consultasCtrl.dashboard);
router.get('/consultas', autenticar, consultasCtrl.listar);
router.get('/consultas/:id', autenticar, consultasCtrl.obter);

// Marcação pública (sem auth)
router.post('/consultas', marcacaoLimiter,
  body('paciente_nome').notEmpty().withMessage('Nome obrigatório'),
  body('paciente_telefone').notEmpty().withMessage('Telefone obrigatório'),
  body('medico_id').isInt().withMessage('Médico obrigatório'),
  body('especialidade_id').isInt().withMessage('Especialidade obrigatória'),
  body('data_hora').isISO8601().withMessage('Data/hora inválida'),
  validar, consultasCtrl.criar
);

router.patch('/consultas/:id/estado', autenticar,
  body('estado').notEmpty(),
  validar, consultasCtrl.atualizarEstado
);
router.delete('/consultas/:id', autenticar, autorizar('admin','recepcao'), consultasCtrl.cancelar);

// ── PACIENTES ─────────────────────────────────────────────────────────────────
router.get('/pacientes', autenticar, pacientesCtrl.listar);
router.get('/pacientes/:id', autenticar, pacientesCtrl.obter);
router.post('/pacientes', autenticar,
  body('nome').notEmpty(),
  body('telefone').notEmpty(),
  validar, pacientesCtrl.criar
);
router.put('/pacientes/:id', autenticar, pacientesCtrl.atualizar);

// ── MENSAGENS ─────────────────────────────────────────────────────────────────
// Envio público
router.post('/mensagens', marcacaoLimiter,
  body('nome').notEmpty(),
  body('email').isEmail(),
  body('mensagem').isLength({ min: 10 }),
  validar, mensagensCtrl.enviar
);
router.get('/mensagens', autenticar, autorizar('admin','recepcao'), mensagensCtrl.listar);
router.patch('/mensagens/:id/lida', autenticar, autorizar('admin','recepcao'), mensagensCtrl.marcarLida);

module.exports = router;
