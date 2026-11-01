import { randomUUID } from 'node:crypto';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db.js';
import { buildNotificationContent } from '../src/messages.js';
import { createNotificationsRepository } from '../src/notificationsRepository.js';

// Necesita MySQL levantado con la tabla notifications:
//   RUN_DB_TESTS=1 npm test
const suite = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

suite('notificaciones contra la MySQL real', () => {
  let pool;
  let repository;
  const createdMessageIds = [];

  const newMessage = () => {
    const news = {
      messageId: randomUUID(),
      newsType: 'EVENT_CREATED',
      eventId: 999001,
      eventTitle: 'Evento de prueba',
    };
    createdMessageIds.push(news.messageId);
    return news;
  };

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

  test('un alta genera una notificación por cada visitante', async () => {
    const news = newMessage();
    const [[{ visitors }]] = await pool.query(
      "SELECT COUNT(*) AS visitors FROM users WHERE role = 'VISITANTE'",
    );

    const result = await repository.saveNotifications({
      news,
      content: buildNotificationContent(news),
      createdAt: new Date(),
    });

    const [[{ saved }]] = await pool.query(
      'SELECT COUNT(*) AS saved FROM notifications WHERE message_id = ?',
      [news.messageId],
    );
    expect(Number(visitors)).toBeGreaterThan(0);
    expect(Number(saved)).toBe(Number(visitors));
    expect(result.recipients).toBe(Number(visitors));
  });

  test('procesar dos veces el mismo mensaje no duplica las notificaciones', async () => {
    const news = newMessage();
    const args = { news, content: buildNotificationContent(news), createdAt: new Date() };

    await repository.saveNotifications(args);
    const [[{ afterFirst }]] = await pool.query(
      'SELECT COUNT(*) AS afterFirst FROM notifications WHERE message_id = ?',
      [news.messageId],
    );

    await repository.saveNotifications(args);
    const [[{ afterSecond }]] = await pool.query(
      'SELECT COUNT(*) AS afterSecond FROM notifications WHERE message_id = ?',
      [news.messageId],
    );

    expect(Number(afterFirst)).toBeGreaterThan(0);
    expect(Number(afterSecond)).toBe(Number(afterFirst));
  });

  test('la notificación se guarda en español y con la fecha en UTC', async () => {
    const news = newMessage();
    const createdAt = new Date('2026-10-30T12:00:00.123Z');

    await repository.saveNotifications({
      news,
      content: buildNotificationContent(news),
      createdAt,
    });

    const [[row]] = await pool.query(
      `SELECT title, message, event_id, news_type,
              DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.%f') AS created_at_text
       FROM notifications WHERE message_id = ? LIMIT 1`,
      [news.messageId],
    );
    expect(row.title).toBe('Nuevo evento');
    expect(row.message).toBe('Nuevo evento: Evento de prueba');
    expect(Number(row.event_id)).toBe(999001);
    expect(row.news_type).toBe('EVENT_CREATED');
    expect(row.created_at_text).toBe('2026-10-30T12:00:00.123000');
  });
});