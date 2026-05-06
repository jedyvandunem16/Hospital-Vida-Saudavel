const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { body }   = require('express-validator');
const { autenticar, autorizar } = require('../middleware/auth');
const { validar } = require('../middleware/validators');

const authCtrl           = require('../controllers/authController');
const medicosCtrl        = require('../controllers/medicosController');
const consultasCtrl      = require('../controllers/consultasController');
const pacientesCtrl      = require('../controllers/pacientesController');
const mensagensCtrl      = require('../controllers/mensagensController');
const especialidadesCtrl = require('../controllers/especialidadesController');
const hospitaisCtrl      = require('../controllers/hospitaisController');

const router = express.Router();

const loginLimiter    = rateLimit({ windowMs: 15*60*1000, max: 10,  message: { erro: 'Demasiadas tentativas.' } });
const marcacaoLimiter = rateLimit({ windowMs: 60*60*1000, max: 20,  message: { erro: 'Limite de marcações excedido.' } });

// ── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', loginLimiter,
  body('email').isEmail(), body('password').notEmpty(), validar, authCtrl.login
);
router.get('/auth/me', autenticar, authCtrl.me);
router.put('/auth/password', autenticar,
  // [ALTA 2] password_atual também é obrigatória — sem ela o bcrypt.compare recebe undefined
  body('password_atual').notEmpty().withMessage('Password actual obrigatória'),
  body('password_nova').isLength({ min: 8 }).withMessage('Nova password: mínimo 8 caracteres'),
  validar, authCtrl.alterarPassword
);
router.post('/auth/utilizadores', autenticar, autorizar('admin'),
  body('nome').notEmpty(), body('email').isEmail(),
  body('password').isLength({ min: 8 }), body('role').isIn(['admin','medico','recepcao']),
  validar, authCtrl.criarUtilizador
);

// ── HOSPITAIS ─────────────────────────────────────────────────────────────────
router.get('/hospitais',                    hospitaisCtrl.listar);
router.get('/hospitais/:id',                hospitaisCtrl.obter);
router.get('/hospitais/:id/especialidades', hospitaisCtrl.especialidades);
router.get('/hospitais/:id/medicos',        hospitaisCtrl.medicos);
router.post('/hospitais', autenticar, autorizar('admin'),
  body('nome').notEmpty(), body('municipio').notEmpty(),
  validar, hospitaisCtrl.criar
);
router.put('/hospitais/:id',    autenticar, autorizar('admin'), hospitaisCtrl.atualizar);
// [MÉDIA 5] Rota DELETE em falta — soft delete via hospitaisCtrl.remover
router.delete('/hospitais/:id', autenticar, autorizar('admin'), hospitaisCtrl.remover);

// ── ESPECIALIDADES ────────────────────────────────────────────────────────────
router.get('/especialidades', especialidadesCtrl.listar);
router.post('/especialidades', autenticar, autorizar('admin'),
  body('nome').notEmpty(), validar, especialidadesCtrl.criar
);

// ── MÉDICOS ───────────────────────────────────────────────────────────────────
router.get('/medicos',                     medicosCtrl.listar);
router.get('/medicos/:id',                 medicosCtrl.obter);
router.get('/medicos/:id/disponibilidade', medicosCtrl.disponibilidade);
router.post('/medicos', autenticar, autorizar('admin'),
  body('nome').notEmpty(), body('especialidade_id').isInt(),
  validar, medicosCtrl.criar
);
router.put('/medicos/:id',    autenticar, autorizar('admin'), medicosCtrl.atualizar);
router.delete('/medicos/:id', autenticar, autorizar('admin'), medicosCtrl.remover);

// ── CONSULTAS ─────────────────────────────────────────────────────────────────
// NOTA: /consultas/dashboard deve ficar ANTES de /consultas/:id para o Express
// não interpretar "dashboard" como um id.
router.get('/consultas/dashboard', autenticar, autorizar('admin','recepcao'), consultasCtrl.dashboard);
router.get('/consultas',           autenticar, consultasCtrl.listar);
router.get('/consultas/:id',       autenticar, consultasCtrl.obter);
router.post('/consultas', marcacaoLimiter,
  body('paciente_nome').notEmpty().withMessage('Nome obrigatório'),
  body('paciente_telefone').notEmpty().withMessage('Telefone obrigatório'),
  body('medico_id').isInt().withMessage('Médico obrigatório'),
  body('especialidade_id').isInt().withMessage('Especialidade obrigatória'),
  body('data_hora').isISO8601().withMessage('Data/hora inválida'),
  validar, consultasCtrl.criar
);
router.patch('/consultas/:id/estado', autenticar,
  body('estado').notEmpty(), validar, consultasCtrl.atualizarEstado
);
router.delete('/consultas/:id', autenticar, autorizar('admin','recepcao'), consultasCtrl.cancelar);

// ── PACIENTES ─────────────────────────────────────────────────────────────────
// [ALTA 3] Separado em duas rotas com semântica clara:
//
//   GET /pacientes/buscar?telefone=XXX — pública, devolve apenas nome e id
//     (usada pelo formulário de marcação para pré-preencher nome do paciente)
//
//   GET /pacientes — protegida (admin/recepcao), devolve todos os campos
router.get('/pacientes/buscar',
  body('telefone').notEmpty(), // validação de query não usa body(), ver nota abaixo
  pacientesCtrl.buscarPorTelefone   // novo método no controller — ver abaixo
);
router.get('/pacientes',     autenticar, autorizar('admin','recepcao'), pacientesCtrl.listar);
router.get('/pacientes/:id', autenticar, pacientesCtrl.obter);
router.post('/pacientes', autenticar,
  body('nome').notEmpty(), body('telefone').notEmpty(), validar, pacientesCtrl.criar
);
router.put('/pacientes/:id', autenticar, pacientesCtrl.atualizar);

// ── MENSAGENS ─────────────────────────────────────────────────────────────────
router.post('/mensagens', marcacaoLimiter,
  body('nome').notEmpty(), body('email').isEmail(),
  body('mensagem').isLength({ min: 10 }), validar, mensagensCtrl.enviar
);
router.get('/mensagens',           autenticar, autorizar('admin','recepcao'), mensagensCtrl.listar);
router.patch('/mensagens/:id/lida', autenticar, autorizar('admin','recepcao'), mensagensCtrl.marcarLida);

module.exports = router;