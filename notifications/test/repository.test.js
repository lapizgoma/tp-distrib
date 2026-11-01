import { describe, test, expect } from '@jest/globals';
import { createNotificationsRepository } from '../src/notificationsRepository.js';

const CREATED_AT = new Date('2026-10-30T12:00:00.123Z');
const CONTENT = { title: 'Nuevo evento', message: 'Nuevo evento: Charla X' };
const news = (overrides = {}) => ({
  messageId: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
  newsType: 'EVENT_CREATED',
  eventId: 12,
  eventTitle: 'Charla X',
  ...overrides,
});

// Pool falso: registra cada operación en orden. Los SELECT devuelven los
// destinatarios pedidos; los INSERT pueden fallar a pedido.
function fakePool({ recipientIds = [1, 2, 3], failInsert = false } = {}) {
  const log = [];
  const connection = {
    beginTransaction: async () => log.push({ op: 'begin' }),
    query: async (sql, params) => {
      const isSelect = /^\s*SELECT/i.test(sql);
      log.push({ op: isSelect ? 'select' : 'insert', sql, params });
      if (isSelect) return [recipientIds.map((id) => ({ id }))];
      if (failInsert) throw new Error('ER_NO_SUCH_TABLE');
      return [{ affectedRows: params[0].length }];
    },
    commit: async () => log.push({ op: 'commit' }),
    rollback: async () => log.push({ op: 'rollback' }),
    release: () => log.push({ op: 'release' }),
  };
  return { log, pool: { getConnection: async () => connection } };
}

const ops = (log) => log.map((entry) => entry.op);

describe('destinatarios de las notificaciones', () => {
  test('un alta busca a todos los usuarios con rol VISITANTE', async () => {
    const { log, pool } = fakePool();

    await createNotificationsRepository(pool).saveNotifications({
      news: news({ newsType: 'EVENT_CREATED' }),
      content: CONTENT,
      createdAt: CREATED_AT,
    });

    const select = log.find((entry) => entry.op === 'select');
    expect(select.sql).toContain('FROM users');
    expect(select.sql).toContain("role = 'VISITANTE'");
  });

  test.each(['EVENT_UPDATED', 'EVENT_CANCELLED'])(
    'una novedad %s busca solo a los inscriptos al evento',
    async (newsType) => {
      const { log, pool } = fakePool();

      await createNotificationsRepository(pool).saveNotifications({
        news: news({ newsType, eventId: 33 }),
        content: CONTENT,
        createdAt: CREATED_AT,
      });

      const select = log.find((entry) => entry.op === 'select');
      expect(select.sql).toContain('FROM events_registrations');
      expect(select.params).toEqual([33]);
    },
  );
});

describe('guardado de las notificaciones', () => {
  test('cada fila lleva mensaje, usuario, evento, tipo, título, texto y fecha', async () => {
    const { log, pool } = fakePool({ recipientIds: [4, 9] });

    await createNotificationsRepository(pool).saveNotifications({
      news: news(),
      content: CONTENT,
      createdAt: CREATED_AT,
    });

    const insert = log.find((entry) => entry.op === 'insert');
    expect(insert.params[0]).toEqual([
      ['7f0c9d2e-4a1b-4c3d-9e8f-123456789abc', 4, 12, 'EVENT_CREATED', 'Nuevo evento', 'Nuevo evento: Charla X', CREATED_AT],
      ['7f0c9d2e-4a1b-4c3d-9e8f-123456789abc', 9, 12, 'EVENT_CREATED', 'Nuevo evento', 'Nuevo evento: Charla X', CREATED_AT],
    ]);
  });

  test('el INSERT absorbe los duplicados con la clave única en vez de fallar', async () => {
    const { log, pool } = fakePool();

    await createNotificationsRepository(pool).saveNotifications({
      news: news(),
      content: CONTENT,
      createdAt: CREATED_AT,
    });

    expect(log.find((entry) => entry.op === 'insert').sql).toContain('ON DUPLICATE KEY UPDATE');
  });

  test('250 destinatarios se insertan en lotes de 100, 100 y 50 dentro de una sola transacción', async () => {
    const recipientIds = Array.from({ length: 250 }, (_, i) => i + 1);
    const { log, pool } = fakePool({ recipientIds });

    const result = await createNotificationsRepository(pool).saveNotifications({
      news: news(),
      content: CONTENT,
      createdAt: CREATED_AT,
    });

    const inserts = log.filter((entry) => entry.op === 'insert');
    expect(inserts.map((entry) => entry.params[0].length)).toEqual([100, 100, 50]);
    expect(ops(log)).toEqual(['begin', 'select', 'insert', 'insert', 'insert', 'commit', 'release']);
    expect(result).toEqual({ recipients: 250 });
  });

  test('un evento sin destinatarios no inserta nada y termina bien', async () => {
    const { log, pool } = fakePool({ recipientIds: [] });

    const result = await createNotificationsRepository(pool).saveNotifications({
      news: news({ newsType: 'EVENT_UPDATED' }),
      content: CONTENT,
      createdAt: CREATED_AT,
    });

    expect(result).toEqual({ recipients: 0 });
    expect(ops(log)).toEqual(['begin', 'select', 'commit', 'release']);
  });

  test('si un INSERT falla, se hace rollback, no se hace commit y se libera la conexión', async () => {
    const { log, pool } = fakePool({ failInsert: true });

    await expect(
      createNotificationsRepository(pool).saveNotifications({
        news: news(),
        content: CONTENT,
        createdAt: CREATED_AT,
      }),
    ).rejects.toThrow('ER_NO_SUCH_TABLE');

    expect(ops(log)).toEqual(['begin', 'select', 'insert', 'rollback', 'release']);
  });
});