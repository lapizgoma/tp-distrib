import express from 'express';
import { createAuthMiddleware } from './auth.js';
import { logger as defaultLogger } from './logger.js';
import { sendProblem } from './problem.js';

const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 50;
const DEFAULT_HEALTH_TIMEOUT_MS = 2000;

// Entero decimal estricto. Ausente o vacío -> valor por defecto.
function readInteger(raw, fallback) {
  if (raw === undefined || raw === '') return { value: fallback };
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return { invalid: true };
  const value = Number(raw);
  return Number.isSafeInteger(value) ? { value } : { invalid: true };
}

function onlyGet(req, res, next) {
  if (req.method === 'GET') return next();
  res.set('Allow', 'GET');
  return sendProblem(req, res, 405, 'solo se permite GET');
}

// Todo se inyecta (repositorio, ping a la base, config del JWT) para testear
// el HTTP con supertest sin MySQL ni Kafka.
export function createApp({
  repository,
  ping,
  jwt,
  logger = defaultLogger,
  healthTimeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
}) {
  const app = express();
  app.disable('x-powered-by');

  const auth = createAuthMiddleware(jwt);

  app.all('/health', onlyGet, async (req, res) => {
    let timer;
    try {
      await Promise.race([
        ping(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('timeout')), healthTimeoutMs);
        }),
      ]);
      res.json({ status: 'ok', service: 'notifications' });
    } catch (err) {
      logger.warn(`health: la base no responde: ${err.message}`);
      sendProblem(req, res, 503, 'db no disponible');
    } finally {
      clearTimeout(timer);
    }
  });

  app.all('/api/notifications', onlyGet, auth, async (req, res, next) => {
    const pageParam = readInteger(req.query.page, 0);
    if (pageParam.invalid) {
      return sendProblem(req, res, 400, 'page debe ser un entero >= 0');
    }

    const sizeParam = readInteger(req.query.size, DEFAULT_PAGE_SIZE);
    if (sizeParam.invalid || sizeParam.value < MIN_PAGE_SIZE || sizeParam.value > MAX_PAGE_SIZE) {
      return sendProblem(req, res, 400, `size debe ser un entero entre ${MIN_PAGE_SIZE} y ${MAX_PAGE_SIZE}`);
    }

    const page = pageParam.value;
    const size = sizeParam.value;
    const offset = page * size;
    if (!Number.isSafeInteger(offset)) {
      return sendProblem(req, res, 400, 'page es demasiado grande');
    }

    try {
      // Se pide una fila de más para saber si hay otra página sin hacer COUNT.
      const rows = await repository.listForUser({ userId: req.userId, limit: size + 1, offset });
      const hasMore = rows.length > size;
      return res.json({ content: hasMore ? rows.slice(0, size) : rows, page, size, hasMore });
    } catch (err) {
      return next(err);
    }
  });

  app.use((req, res) => sendProblem(req, res, 404, 'ruta no encontrada'));

  // El detalle del error se loguea pero no se devuelve.
  app.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.path}: ${err.message}`);
    if (res.headersSent) return next(err);
    return sendProblem(req, res, 500, 'no se pudieron consultar las notificaciones');
  });

  return app;
}