import express from 'express';
import config from '../config.js';
import auth from '../middleware/auth.js';
import { sendGrpcError } from '../utils/grpcErrors.js';
import {
  buildRoomSchedule,
  filterEventsBySchedule,
  formatLocalDateTime,
  isValidStartDatetime,
} from '../utils/tourSchedule.js';

const ARRAY_FIELDS = ['topics', 'eras', 'techniques'];
const LIMIT_FIELDS = ['max_duration_minutes', 'max_works_count'];
const INT32_MAX = 2147483647;

function emptyPreferences() {
  return {
    preferred_topics: [],
    preferred_eras: [],
    preferred_techniques: [],
  };
}

function preferencesToCriteria(preferences) {
  return {
    preferred_topics: preferences?.favorite_topics ?? [],
    preferred_eras: preferences?.favorite_eras ?? [],
    preferred_techniques: preferences?.favorite_techniques ?? [],
  };
}

async function loadPreferences(call, clients, user) {
  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    console.error('No se pudieron cargar preferencias: id de usuario inválido');
    return emptyPreferences();
  }

  try {
    const profile = await call(
      clients.users,
      'GetUserProfile',
      { user_id: userId },
      user,
      config.grpc.usersDeadlineMs,
    );
    return preferencesToCriteria(profile?.preferences);
  } catch (err) {
    // Las preferencias son opcionales: el tour sigue sin personalizar.
    console.error('No se pudieron cargar preferencias:', err?.details ?? err?.message ?? err);
    return emptyPreferences();
  }
}

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

function hasStartDatetime(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
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

  if (hasStartDatetime(body.start_datetime) && !isValidStartDatetime(body.start_datetime)) {
    return 'start_datetime debe tener formato YYYY-MM-DDTHH:mm';
  }

  if (body.use_preferences !== undefined && typeof body.use_preferences !== 'boolean') {
    return 'use_preferences debe ser un booleano';
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
      const preferences = body.use_preferences === false
        ? emptyPreferences()
        : await loadPreferences(call, clients, req.user);
      const criteria = { ...toCriteria(body), ...preferences };

      const plan = await call(
        clients.works,
        'SearchWorksForTour',
        criteria,
        req.user,
      );

      const startDatetime = hasStartDatetime(body.start_datetime)
        ? String(body.start_datetime).trim()
        : formatLocalDateTime(new Date());
      const schedule = buildRoomSchedule(plan, startDatetime);
      if (!schedule) {
        return res.status(400).json({
          error: 'start_datetime debe tener formato YYYY-MM-DDTHH:mm',
        });
      }

      let events = [];
      const rooms = plan.rooms ?? [];
      if (rooms.length > 0) {
        const eventResponse = await call(
          clients.events,
          'GetEventsByLocations',
          {
            locations: rooms,
            only_future: false,
            start_datetime: schedule.start_datetime,
            end_datetime: schedule.end_datetime,
          },
          req.user,
        );
        events = filterEventsBySchedule(eventResponse.events ?? [], schedule.room_schedule);
      }

      res.json({
        ...plan,
        start_datetime: schedule.start_datetime,
        end_datetime: schedule.end_datetime,
        room_schedule: schedule.room_schedule,
        events,
      });
    } catch (err) {
      sendGrpcError(res, err);
    }
  });

  return router;
}
