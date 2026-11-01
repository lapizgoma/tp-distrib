import { randomUUID } from 'node:crypto';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db.js';
import { buildNotificationContent } from '../src/messages.js';
import { createNotificationsRepository } from '../src/notificationsRepository.js';

// Necesita MySQL levantado con la tabla notifications y los usuarios del seed:
//   RUN_DB_TESTS=1 npm test
const suite = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

suite('consulta de notificaciones contra la MySQL real', () => {
  let pool;
  let repository;
  const createdMessageIds = [];

  beforeAll(() => {
    pool = createPool(loadConfig().db);
    repository = createNotificationsRepository(pool);
  });

  afterAll(async () => {
    if (!pool) return;
    if (createdMessageIds.length > 0) {
      await pool.query('DELETE FROM notifications WHERE message_id IN (?)', [createdMessageIds]);
    }
    await pool.end();
  });

  async function firstVisitorId() {
    const [[row]] = await pool.query("SELECT id FROM users WHERE role = 'VISITANTE' ORDER BY id LIMIT 1");
    return Number(row.id);
  }

  // Un alta guarda una notificación por cada visitante, con la fecha dada.
  async function saveAt(createdAt) {
    const news = {
      messageId: randomUUID(),
      newsType: 'EVENT_CREATED',
      eventId: 999002,
      eventTitle: 'Evento de prueba de consulta',
    };
    createdMessageIds.push(news.messageId);
    await repository.saveNotifications({ news, content: buildNotificationContent(news), createdAt });
    return news.messageId;
  }

  test('devuelve las notificaciones de la más nueva a la más vieja y con el formato de la API', async () => {
    const userId = await firstVisitorId();
    const oldest = await saveAt(new Date('2099-01-01T00:00:00.000Z'));
    const middle = await saveAt(new Date('2099-01-01T00:00:01.000Z'));
    const newest = await saveAt(new Date('2099-01-01T00:00:02.500Z'));
    const ours = new Set([oldest, middle, newest]);

    const all = await repository.listForUser({ userId, limit: 100000, offset: 0 });
    const mine = all.filter((notification) => ours.has(notification.messageId));

    expect(mine.map((notification) => notification.messageId)).toEqual([newest, middle, oldest]);
    expect(mine[0]).toEqual({
      id: expect.any(Number),
      messageId: newest,
      eventId: 999002,
      newsType: 'EVENT_CREATED',
      title: 'Nuevo evento',
      message: 'Nuevo evento: Evento de prueba de consulta',
      isRead: false,
      createdAt: '2099-01-01T00:00:02.500Z',
    });
  });

  test('devuelve exactamente las notificaciones del usuario pedido y ninguna de otros', async () => {
    const userId = await firstVisitorId();
    await saveAt(new Date());

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?', [
      userId,
    ]);
    const [[{ others }]] = await pool.query('SELECT COUNT(*) AS others FROM notifications WHERE user_id <> ?', [
      userId,
    ]);
    const all = await repository.listForUser({ userId, limit: 100000, offset: 0 });

    expect(Number(others)).toBeGreaterThan(0);
    expect(all).toHaveLength(Number(total));
  });

  test('LIMIT y OFFSET recortan la lista completa sin saltear ni repetir filas', async () => {
    const userId = await firstVisitorId();
    await saveAt(new Date('2099-01-02T00:00:00.000Z'));
    await saveAt(new Date('2099-01-02T00:00:01.000Z'));
    await saveAt(new Date('2099-01-02T00:00:02.000Z'));

    const all = await repository.listForUser({ userId, limit: 100000, offset: 0 });
    const slice = await repository.listForUser({ userId, limit: 2, offset: 1 });

    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(slice).toEqual(all.slice(1, 3));
  });

  test('unreadOnly devuelve solo las no leídas y markAllRead las marca todas', async () => {
    const userId = await firstVisitorId();
    const messageId = await saveAt(new Date('2099-01-03T00:00:00.000Z'));

    const unreadBefore = await repository.listForUser({
      userId,
      limit: 100000,
      offset: 0,
      unreadOnly: true,
    });
    expect(unreadBefore.some((notification) => notification.messageId === messageId)).toBe(true);
    expect(unreadBefore.every((notification) => notification.isRead === false)).toBe(true);

    const updated = await repository.markAllRead(userId);
    expect(updated).toBeGreaterThanOrEqual(1);

    const unreadAfter = await repository.listForUser({
      userId,
      limit: 100000,
      offset: 0,
      unreadOnly: true,
    });
    expect(unreadAfter).toHaveLength(0);
  });
});


