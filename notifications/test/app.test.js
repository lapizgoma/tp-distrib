import { STATUS_CODES } from 'node:http';
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';

const SECRET = 'test-secret-key-0123456789-abcdefghij-xyz';
const ISSUER = 'museo-virtual';
const silentLogger = { info() {}, warn() {}, error() {} };

const nowSeconds = () => Math.floor(Date.now() / 1000);

// Claims como los que emite Spring; cada test pisa lo que necesita.
const claims = (overrides = {}) => ({
  sub: 'visitante@museo.com',
  userId: 4,
  role: 'VISITANTE',
  iss: ISSUER,
  exp: nowSeconds() + 3600,
  ...overrides,
});

const sign = (payload, { secret = SECRET, algorithm = 'HS256' } = {}) =>
  jwt.sign(payload, secret, { algorithm });

const notification = (id) => ({
  id,
  messageId: `msg-${id}`,
  eventId: 12,
  newsType: 'EVENT_CREATED',
  title: 'Nuevo evento',
  message: 'Nuevo evento: Charla X',
  isRead: false,
  createdAt: '2026-10-30T12:00:00.000Z',
});

// Ya ordenadas de la más nueva a la más vieja, como las devuelve el repositorio.
const notifications = (count) => Array.from({ length: count }, (_, i) => notification(count - i));

function setup({
  rows = [],
  failList = false,
  failMark = false,
  ping = async () => {},
  healthTimeoutMs,
} = {}) {
  const calls = [];
  const markCalls = [];
  const repository = {
    listForUser: async (args) => {
      calls.push(args);
      if (failList) throw new Error('ER_ACCESS_DENIED: secreto de la base');
      const filtered = args.unreadOnly ? rows.filter((n) => !n.isRead) : rows;
      return filtered.slice(args.offset, args.offset + args.limit);
    },
    markAllRead: async (userId) => {
      markCalls.push(userId);
      if (failMark) throw new Error('ER_ACCESS_DENIED: secreto de la base');
      return rows.filter((n) => !n.isRead).length;
    },
  };
  const app = createApp({
    repository,
    ping,
    jwt: { secret: SECRET, issuer: ISSUER },
    logger: silentLogger,
    healthTimeoutMs,
  });
  return { app, calls, markCalls };
}

const get = (app, url, token = sign(claims())) =>
  request(app).get(url).set('Authorization', `Bearer ${token}`);

const expectProblem = (res, status, path) => {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
  expect(res.body).toEqual({
    type: 'about:blank',
    title: STATUS_CODES[status],
    status,
    detail: expect.any(String),
    instance: path,
  });
};

describe('autenticación de GET /api/notifications', () => {
  test('sin token responde 401 y no consulta la base', async () => {
    const { app, calls } = setup();

    const res = await request(app).get('/api/notifications');

    expectProblem(res, 401, '/api/notifications');
    expect(calls).toHaveLength(0);
  });

  test('un header que no es Bearer responde 401', async () => {
    const { app, calls } = setup();

    const res = await request(app).get('/api/notifications').set('Authorization', 'Basic dXNlcjpwYXNz');

    expectProblem(res, 401, '/api/notifications');
    expect(calls).toHaveLength(0);
  });

  test.each([
    ['está firmado con otro secreto', () => sign(claims(), { secret: 'otro-secreto-distinto-0123456789-abcdefghi' })],
    ['está vencido', () => sign(claims({ exp: nowSeconds() - 60 }))],
    ['tiene otro emisor', () => sign(claims({ iss: 'otro-emisor' }))],
    [
      'no tiene fecha de vencimiento',
      () => {
        const { exp, ...withoutExp } = claims();
        return sign(withoutExp);
      },
    ],
    ['está firmado con HS512', () => sign(claims(), { algorithm: 'HS512' })],
    [
      'no tiene userId',
      () => {
        const { userId, ...withoutUserId } = claims();
        return sign(withoutUserId);
      },
    ],
    ['tiene el userId como texto', () => sign(claims({ userId: '4' }))],
    ['tiene el userId en cero', () => sign(claims({ userId: 0 }))],
    ['tiene el userId negativo', () => sign(claims({ userId: -3 }))],
    ['tiene el userId decimal', () => sign(claims({ userId: 4.5 })) ],
    ['no es un token', () => 'esto.no.es-un-token'],
  ])('un token que %s responde 401 y no consulta la base', async (_caso, makeToken) => {
    const { app, calls } = setup();

    const res = await get(app, '/api/notifications', makeToken());

    expectProblem(res, 401, '/api/notifications');
    expect(calls).toHaveLength(0);
  });

  test.each(['VISITANTE', 'CURADOR', 'ADMINISTRADOR'])(
    'un usuario con rol %s puede consultar sus notificaciones',
    async (role) => {
      const { app } = setup({ rows: notifications(1) });

      const res = await get(app, '/api/notifications', sign(claims({ role })));

      expect(res.status).toBe(200);
      expect(res.body.content).toHaveLength(1);
    },
  );
});

describe('de quién son las notificaciones', () => {
  test('el userId sale del token', async () => {
    const { app, calls } = setup();

    await get(app, '/api/notifications', sign(claims({ userId: 7 })));

    expect(calls[0].userId).toBe(7);
  });

  test('un userId pasado por parámetro se ignora y se usa el del token', async () => {
    const { app, calls } = setup();

    await get(app, '/api/notifications?userId=99');

    expect(calls).toHaveLength(1);
    expect(calls[0].userId).toBe(4);
  });
});

describe('paginación', () => {
  test('sin parámetros pide la página 0 de 20 y una fila de más para calcular hasMore', async () => {
    const { app, calls } = setup({ rows: notifications(3) });

    const res = await get(app, '/api/notifications');

    expect(res.status).toBe(200);
    expect(calls).toEqual([{ userId: 4, limit: 21, offset: 0, unreadOnly: false }]);
    expect(res.body).toMatchObject({ page: 0, size: 20, hasMore: false });
    expect(res.body.content).toHaveLength(3);
  });

  test('con más filas que el tamaño devuelve solo el tamaño y hasMore en true', async () => {
    const { app } = setup({ rows: notifications(45) });

    const res = await get(app, '/api/notifications?page=0&size=20');

    expect(res.body.hasMore).toBe(true);
    expect(res.body.content).toHaveLength(20);
    expect(res.body.content[0].id).toBe(45);
    expect(res.body.content[19].id).toBe(26);
  });

  test('la última página trae lo que queda y hasMore en false', async () => {
    const { app, calls } = setup({ rows: notifications(45) });

    const res = await get(app, '/api/notifications?page=2&size=20');

    expect(calls[0]).toEqual({ userId: 4, limit: 21, offset: 40, unreadOnly: false });
    expect(res.body).toMatchObject({ page: 2, size: 20, hasMore: false });
    expect(res.body.content.map((n) => n.id)).toEqual([5, 4, 3, 2, 1]);
  });

  test('si hay exactamente tantas filas como el tamaño, hasMore es false', async () => {
    const { app } = setup({ rows: notifications(20) });

    const res = await get(app, '/api/notifications?size=20');

    expect(res.body.hasMore).toBe(false);
    expect(res.body.content).toHaveLength(20);
  });

  test('un usuario sin notificaciones recibe una lista vacía', async () => {
    const { app } = setup({ rows: [] });

    const res = await get(app, '/api/notifications');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ content: [], page: 0, size: 20, hasMore: false });
  });

  test.each([1, 50])('el tamaño %i es válido', async (size) => {
    const { app, calls } = setup();

    const res = await get(app, `/api/notifications?size=${size}`);

    expect(res.status).toBe(200);
    expect(calls[0].limit).toBe(size + 1);
  });

  test.each([
    ['page=-1'],
    ['page=abc'],
    ['page=1.5'],
    ['page=1&page=2'],
    ['page=99999999999999999999'],
    ['size=0'],
    ['size=51'],
    ['size=abc'],
    ['size=-5'],
    ['size=1.5'],
    ['size=10&size=20'],
  ])('los parámetros %s responden 400 y no consultan la base', async (query) => {
    const { app, calls } = setup();

    const res = await get(app, `/api/notifications?${query}`);

    expectProblem(res, 400, '/api/notifications');
    expect(calls).toHaveLength(0);
  });
});

describe('errores y rutas', () => {
  test.each(['post', 'put', 'patch', 'delete'])(
    'el método %s responde 405 con Allow: GET',
    async (method) => {
      const { app, calls } = setup();

      const res = await request(app)[method]('/api/notifications').set('Authorization', `Bearer ${sign(claims())}`);

      expectProblem(res, 405, '/api/notifications');
      expect(res.headers.allow).toBe('GET');
      expect(calls).toHaveLength(0);
    },
  );

  test('una ruta desconocida responde 404 en problem+json', async () => {
    const { app } = setup();

    const res = await request(app).get('/api/audit');

    expectProblem(res, 404, '/api/audit');
  });

  test('una subruta de notificaciones también responde 404', async () => {
    const { app } = setup();

    const res = await get(app, '/api/notifications/4');

    expectProblem(res, 404, '/api/notifications/4');
  });

  test('si la base falla responde 500 sin mostrar el detalle del error', async () => {
    const { app } = setup({ failList: true });

    const res = await get(app, '/api/notifications');

    expectProblem(res, 500, '/api/notifications');
    expect(res.text).not.toContain('secreto de la base');
  });
});

describe('notificaciones no leídas', () => {
  test('unreadOnly=true filtra las leídas y devuelve isRead en cada una', async () => {
    const rows = notifications(2).map((row, index) => ({ ...row, isRead: index === 0 }));
    const { app, calls } = setup({ rows });

    const res = await get(app, '/api/notifications?unreadOnly=true');

    expect(res.status).toBe(200);
    expect(calls).toEqual([{ userId: 4, limit: 21, offset: 0, unreadOnly: true }]);
    expect(res.body.content.map((n) => n.id)).toEqual([1]);
    expect(res.body.content[0].isRead).toBe(false);
  });

  test('sin unreadOnly el repositorio recibe false y devuelve todas', async () => {
    const rows = notifications(2).map((row, index) => ({ ...row, isRead: index === 0 }));
    const { app, calls } = setup({ rows });

    const res = await get(app, '/api/notifications');

    expect(res.status).toBe(200);
    expect(calls[0].unreadOnly).toBe(false);
    expect(res.body.content).toHaveLength(2);
    expect(res.body.content[0].isRead).toBe(true);
  });

  test.each(['yes', '1', 'TRUE', '0', 'si'])(
    'unreadOnly=%s responde 400 y no consulta la base',
    async (value) => {
      const { app, calls } = setup();

      const res = await get(app, `/api/notifications?unreadOnly=${value}`);

      expectProblem(res, 400, '/api/notifications');
      expect(calls).toHaveLength(0);
    },
  );
});

describe('PATCH /api/notifications/read', () => {
  const patch = (app, token = sign(claims())) =>
    request(app).patch('/api/notifications/read').set('Authorization', `Bearer ${token}`);

  test('sin token responde 401 y no marca nada', async () => {
    const { app, markCalls } = setup();

    const res = await request(app).patch('/api/notifications/read');

    expectProblem(res, 401, '/api/notifications/read');
    expect(markCalls).toHaveLength(0);
  });

  test('marca como leídas las notificaciones del usuario del token', async () => {
    const { app, markCalls } = setup({ rows: notifications(3) });

    const res = await patch(app, sign(claims({ userId: 7 })));

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(markCalls).toEqual([7]);
  });

  test('ignora un userId pasado por parámetro', async () => {
    const { app, markCalls } = setup();

    const res = await request(app)
      .patch('/api/notifications/read?userId=99')
      .set('Authorization', `Bearer ${sign(claims())}`);

    expect(res.status).toBe(204);
    expect(markCalls).toEqual([4]);
  });

  test.each(['get', 'post', 'put', 'delete'])(
    'el método %s responde 405 con Allow: PATCH',
    async (method) => {
      const { app, markCalls } = setup();

      const res = await request(app)[method]('/api/notifications/read').set(
        'Authorization',
        `Bearer ${sign(claims())}`,
      );

      expectProblem(res, 405, '/api/notifications/read');
      expect(res.headers.allow).toBe('PATCH');
      expect(markCalls).toHaveLength(0);
    },
  );

  test('si la base falla responde 500 sin mostrar el detalle del error', async () => {
    const { app } = setup({ failMark: true });

    const res = await patch(app);

    expectProblem(res, 500, '/api/notifications/read');
    expect(res.text).not.toContain('secreto de la base');
  });
});

describe('GET /health', () => {
  test('con la base respondiendo devuelve 200 y no pide token', async () => {
    const { app } = setup();

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'notifications' });
  });

  test('si la base falla devuelve 503 sin mostrar el detalle del error', async () => {
    const { app } = setup({
      ping: async () => {
        throw new Error('ECONNREFUSED 10.0.0.5:3306');
      },
    });

    const res = await request(app).get('/health');

    expectProblem(res, 503, '/health');
    expect(res.text).not.toContain('10.0.0.5');
  });

  test('si la base no contesta a tiempo devuelve 503', async () => {
    const { app } = setup({ ping: () => new Promise(() => {}), healthTimeoutMs: 20 });

    const res = await request(app).get('/health');

    expectProblem(res, 503, '/health');
  });

  test('un método distinto de GET responde 405', async () => {
    const { app } = setup();

    const res = await request(app).post('/health');

    expectProblem(res, 405, '/health');
    expect(res.headers.allow).toBe('GET');
  });
});