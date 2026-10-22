import express from 'express';
import auth from '../middleware/auth.js';
import { sendGrpcError } from '../utils/grpcErrors.js';

function validateBody(body) {
  const ids = body && body.work_ids;
  if (!Array.isArray(ids)) return 'work_ids debe ser un array';
  if (!ids.every((id) => Number.isSafeInteger(id) && id > 0)) {
    return 'work_ids debe contener solo enteros positivos';
  }
  if (new Set(ids).size < 2) return 'Se necesitan al menos 2 obras distintas para comparar';
  return null;
}

// Patrón de todas las rutas: una función que recibe { clients, call } y devuelve un Router.
export default function comparisonRoutes({ clients, call }) {
  const router = express.Router();

  router.post('/works/compare', auth(['VISITANTE', 'CURADOR', 'ADMINISTRADOR']), async (req, res) => {
    const problem = validateBody(req.body);
    if (problem) return res.status(400).json({ error: problem });

    try {
      const response = await call(clients.works, 'GetWorksForComparison', { work_ids: req.body.work_ids }, req.user);
      res.json(response);
    } catch (err) {
      sendGrpcError(res, err);
    }
  });

  return router;
}