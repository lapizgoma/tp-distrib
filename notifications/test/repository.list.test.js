import { describe, test, expect } from '@jest/globals';
import { createNotificationsRepository } from '../src/notificationsRepository.js';

// Pool falso: devuelve las filas dadas y registra la consulta.
function fakePool(rows = []) {
  const calls = [];
  return {
    calls,
    pool: {
      query: async (sql, params) => {
        calls.push({ sql, params });
        return [rows];
      },
    },
  };
}

const row = (overrides = {}) => ({
  id: '7',
  message_id: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
  event_id: '12',
  news_type: 'EVENT_UPDATED',
  title: 'Evento modificado',
  message: 'Se modificó el evento Charla X',
  created_at: new Date('2026-10-30T12:00:00.123Z'),
  ...overrides,
});

describe('listado de notificaciones de un usuario', () => {
  test('filtra por el usuario, ordena de la más nueva a la más vieja y pagina con LIMIT y OFFSET', async () => {
    const { calls, pool } = fakePool();

    await createNotificationsRepository(pool).listForUser({ userId: 4, limit: 21, offset: 40 });

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toMatch(/FROM notifications/);
    expect(calls[0].sql).toMatch(/WHERE user_id = \?/);
    expect(calls[0].sql).toMatch(/ORDER BY created_at DESC, id DESC/);
    expect(calls[0].sql).toMatch(/LIMIT \? OFFSET \?/);
    expect(calls[0].params).toEqual([4, 21, 40]);
  });

  test('cada fila sale con el formato de la API, con la fecha en UTC y sin el id del usuario', async () => {
    const { pool } = fakePool([row()]);

    const result = await createNotificationsRepository(pool).listForUser({ userId: 4, limit: 21, offset: 0 });

    expect(result).toEqual([
      {
        id: 7,
        messageId: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
        eventId: 12,
        newsType: 'EVENT_UPDATED',
        title: 'Evento modificado',
        message: 'Se modificó el evento Charla X',
        createdAt: '2026-10-30T12:00:00.123Z',
      },
    ]);
    expect(result[0]).not.toHaveProperty('userId');
    expect(result[0]).not.toHaveProperty('user_id');
  });

  test('un usuario sin notificaciones devuelve una lista vacía', async () => {
    const { pool } = fakePool([]);

    const result = await createNotificationsRepository(pool).listForUser({ userId: 4, limit: 21, offset: 0 });

    expect(result).toEqual([]);
  });
});