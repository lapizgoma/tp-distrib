import express from 'express';
import auth from '../middleware/auth.js';
import { sendGrpcError } from '../utils/grpcErrors.js';

const DEFAULT_LIMIT = 5;
const INT32_MAX = 2147483647;

function parseLimit(raw) {
  if (raw === undefined) 
    return DEFAULT_LIMIT;
  const value = typeof raw === 'string' ? raw.trim() : raw;
  if (value === '') 
    return DEFAULT_LIMIT;
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > INT32_MAX) 
    return null;
  
  return limit;
}

export default function recommendationsRoutes({ clients, call }) {
  const router = express.Router();

  router.get('/works/recommended', auth(['VISITANTE']), async (req, res) => {
    const limit = parseLimit(req.query.limit);
    
    if (limit === null) {
      return res.status(400).json({ error: `limit debe ser un entero entre 1 y ${INT32_MAX}` });
    }

    const userId = Number(req.user.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'El token no tiene un id válido' });
    }

    try {
      const response = await call(
        clients.works,
        'GetRecommendedWorks',
        { user_id: userId, limit },
        req.user,
      );
      res.json(response);
    } catch (err) {
      sendGrpcError(res, err);
    }
  });

  // POST /api/grpc/works/:id/interactions — Registrar interacción de visualización (VIEW)
  router.post('/works/:id/interactions', auth(['VISITANTE', 'CURADOR', 'ADMINISTRADOR']), async (req, res) => {
    const userId = Number(req.user.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'El token no tiene un id válido' });
    }

    const workId = Number(req.params.id);
    if (!Number.isSafeInteger(workId) || workId <= 0) {
      return res.status(400).json({ error: 'El ID de la obra debe ser un entero positivo' });
    }

    try {
      const response = await call(
        clients.users,
        'RegisterInteraction',
        {
          user_id: userId,
          work_id: workId,
          interaction_type: req.body.interaction_type || 'VIEW',
        },
        req.user,
      );
      res.json(response);
    } catch (err) {
      sendGrpcError(res, err);
    }
  });

  return router;
}
