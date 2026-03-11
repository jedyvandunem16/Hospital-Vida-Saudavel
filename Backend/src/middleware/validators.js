const { validationResult } = require('express-validator');

// Trata erros de validação do express-validator
function validar(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(422).json({
      erro: 'Dados inválidos.',
      detalhes: erros.array().map(e => ({ campo: e.path, msg: e.msg })),
    });
  }
  next();
}

// Handler global de erros
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERRO:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    erro: status === 500 ? 'Erro interno do servidor.' : err.message,
  });
}

// 404
function notFound(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}` });
}

module.exports = { validar, errorHandler, notFound };
