import jwt from 'jsonwebtoken';
import config from '../config.js';

function normalizeRole(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  return String(value).replace(/^ROLE_/i, '').toUpperCase();
}

// auth(['VISITANTE', 'CURADOR']) -> si no se pasan roles, alcanza con estar autenticado
export default function auth(rolesPermitidos = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (!/^Bearer$/i.test(scheme || '') || !token) {
      return res.status(401).json({ error: 'Falta el token de autenticación' });
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret, { algorithms: [config.jwt.algorithm] });
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido o vencido' });
    }

    const id = payload[config.jwt.claimId];
    const rol = normalizeRole(payload[config.jwt.claimRole]);

    if (!id || !rol) {
      return res.status(401).json({ error: 'El token no tiene id o rol' });
    }
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: 'No tenés permisos para esta operación' });
    }

    req.user = { id: String(id), rol };
    next();
  };
}