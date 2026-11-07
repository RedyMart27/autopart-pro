import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: { message: 'Inicia sesion para continuar.', code: 'AUTH_REQUIRED' } });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: { message: 'La sesion vencio. Inicia sesion de nuevo.', code: 'INVALID_TOKEN' } });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'No tienes permiso para esta accion.', code: 'FORBIDDEN' } });
    }
    next();
  };
}
