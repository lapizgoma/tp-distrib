import express from 'express';
import auth from '../middleware/auth.js';
import { sendGrpcError } from '../utils/grpcErrors.js';

const ARRAY_FIELDS = ['topics', 'eras', 'techniques'];
const LIMIT_FIELDS = ['max_duration_minutes', 'max_works_count'];
const INT32_MAX = 2147483647;

function validateStringArray(value, field) {
  if (!Array.isArray(value)) return `${field} debe ser un array`;
  if (!value.every((item) => typeof item === 'string' && item.trim())) {
    return `${field} debe contener solo strings no vacíos`;
  }
  return null;
}

function validateLimit(value, field) {
  if (!Number.isSafeInteger(value) || value < 0 || value > INT32_MAX) {
    return `${field} debe ser un entero entre 0 y ${INT32_MAX}`;
  }
  return null;
}

function validateBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'El body debe ser un objeto JSON';
  }

  for (const field of ARRAY_FIELDS) {
    if (body[field] !== undefined) {
      const problem = validateStringArray(body[field], field);
      if (problem) return problem;
    }
  }

  for (const field of LIMIT_FIELDS) {
    if (body[field] !== undefined) {
      const problem = validateLimit(body[field], field);
      if (problem) return problem;
    }
  }

  return null;
}

function toCriteria(body) {
  return {
    topics: body.topics ?? [],
    eras: body.eras ?? [],
    techniques: body.techniques ?? [],
    max_duration_minutes: body.max_duration_minutes ?? 0,
    max_works_count: body.max_works_count ?? 0,
  };
}

export default function tourRoutes({ clients, call }) {
  const router = express.Router();

  router.post('/tours/plan', auth(['VISITANTE']), async (req, res) => {
    const body = req.body ?? {};
    const problem = validateBody(body);
    if (problem) return res.status(400).json({ error: problem });

    try {
      const plan = await call(
        clients.works,
        'SearchWorksForTour',
        toCriteria(body),
        req.user,
      );

      let events = [];
      const rooms = plan.rooms ?? [];
      if (rooms.length > 0) {
        const eventResponse = await call(
          clients.events,
          'GetEventsByLocations',
          { locations: rooms, only_future: true },
          req.user,
        );
        events = eventResponse.events ?? [];
      }

      res.json({ ...plan, events });
    } catch (err) {
      sendGrpcError(res, err);
    }
  });

  return router;
}
