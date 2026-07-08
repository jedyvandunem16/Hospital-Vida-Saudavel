const jwt = require('jsonwebtoken');

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET obrigatorio em producao.');
  }
  return 'dev-secret-change-me';
}

// Verifica token JWT
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação em falta.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.utilizador = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

// Verifica roles
function autorizar(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.utilizador?.role)) {
      return res.status(403).json({ erro: 'Sem permissão para esta acção.' });
    }
    next();
  };
}

module.exports = { autenticar, autorizar, getJwtSecret };
