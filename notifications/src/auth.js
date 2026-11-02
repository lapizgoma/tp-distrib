import jwt from 'jsonwebtoken';
import { sendProblem } from './problem.js';

const INVALID_TOKEN = 'Token inválido o vencido';

// Valida el JWT que emite Spring (HS256, mismo secreto y emisor) y deja en
// req.userId el claim userId. No filtra por rol: cualquier usuario autenticado
// puede consultar SUS notificaciones. El userId sale siempre del token.
export function createAuthMiddleware({ secret, issuer }) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      return sendProblem(req, res, 401, 'autenticación requerida');
    }

    const match = /^Bearer (\S+)$/i.exec(header);
    if (!match) {
      return sendProblem(req, res, 401, INVALID_TOKEN);
    }

    let claims;
    try {
      claims = jwt.verify(match[1], secret, { algorithms: ['HS256'], issuer });
    } catch {
      return sendProblem(req, res, 401, INVALID_TOKEN);
    }

    // jsonwebtoken no exige exp por defecto: se exige acá.
    if (claims === null || typeof claims !== 'object' || typeof claims.exp !== 'number') {
      return sendProblem(req, res, 401, INVALID_TOKEN);
    }

    const { userId } = claims;
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return sendProblem(req, res, 401, INVALID_TOKEN);
    }

    req.userId = userId;
    return next();
  };
}