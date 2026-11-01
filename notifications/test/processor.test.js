import { describe, test, expect } from '@jest/globals';
import { createMessageHandler, FatalConsumerError } from '../src/processor.js';

const silentLogger = { info() {}, warn() {}, error() {} };
const RETRY = { initialMs: 1000, maxDelayMs: 4000, totalMs: 10000 };

const newsPayload = (overrides = {}) => ({
  schemaVersion: 1,
  messageId: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
  newsType: 'EVENT_CREATED',
  eventId: 12,
  eventTitle: 'Noche de Gala en el Museo',
  ...overrides,
});

const record = (value, offset = 7) => ({
  topic: 'museum.events',
  partition: 2,
  offset: String(offset),
  key: Buffer.from('12'),
  value: value === null || Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value)),
});

// Arma el handler con un repositorio, un DLQ y un reloj falsos.
// El reloj solo avanza cuando el handler "espera", así los tests de
// reintentos son instantáneos y deterministas.
function setup({ failSaves = 0, alwaysFail = false, dlqFails = false } = {}) {
  let clock = 0;
  const calls = { saves: [], dlq: [], commits: 0, waits: [], commitsAtSave: [], order: [] };

  const repository = {
    saveNotifications: async (args) => {
      calls.saves.push(args);
      calls.commitsAtSave.push(calls.commits);
      calls.order.push('save');
      if (alwaysFail || calls.saves.length <= failSaves) {
        throw new Error('ECONNREFUSED: mysql no responde');
      }
      return { recipients: 3 };
    },
  };
  const sendToDlq = async (dlqRecord) => {
    calls.order.push('dlq');
    if (dlqFails) throw new Error('kafka no responde');
    calls.dlq.push(dlqRecord);
  };
  const wait = async (ms) => {
    calls.waits.push(ms);
    clock += ms;
  };

  const handle = createMessageHandler({
    repository,
    sendToDlq,
    wait,
    now: () => clock,
    retry: RETRY,
    logger: silentLogger,
  });
  const run = (kafkaRecord) =>
    handle({
      message: kafkaRecord,
      heartbeat: async () => {},
      commit: async () => {
        calls.commits += 1;
        calls.order.push('commit');
      },
    });

  return { calls, run };
}

describe('procesamiento de un mensaje de novedades', () => {
  test('un mensaje válido se guarda y recién después se confirma el offset', async () => {
    const { calls, run } = setup();

    const outcome = await run(record(newsPayload()));

    expect(outcome).toBe('saved');
    expect(calls.order).toEqual(['save', 'commit']);
    expect(calls.dlq).toHaveLength(0);
  });

  test('las notificaciones se guardan con el texto del tipo de novedad y el título del evento', async () => {
    const { calls, run } = setup();

    await run(record(newsPayload({ newsType: 'EVENT_CANCELLED' })));

    expect(calls.saves[0].news).toEqual({
      messageId: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
      newsType: 'EVENT_CANCELLED',
      eventId: 12,
      eventTitle: 'Noche de Gala en el Museo',
    });
    expect(calls.saves[0].content).toEqual({
      title: 'Evento cancelado',
      message: 'Se canceló el evento Noche de Gala en el Museo',
    });
  });

  test('procesar dos veces el mismo mensaje pide guardar con la misma clave de idempotencia', async () => {
    const { calls, run } = setup();

    await run(record(newsPayload(), 7));
    await run(record(newsPayload(), 7));

    expect(calls.saves).toHaveLength(2);
    expect(calls.saves[0].news.messageId).toBe(calls.saves[1].news.messageId);
    expect(calls.commits).toBe(2);
  });
});

describe('mensajes inválidos', () => {
  test.each([
    ['JSON roto', Buffer.from('{"schemaVersion":1,')],
    ['sin messageId', newsPayload({ messageId: undefined })],
    ['con schemaVersion 2', newsPayload({ schemaVersion: 2 })],
    ['con value null', null],
  ])('un mensaje con %s va de inmediato al DLQ sin tocar la base', async (_caso, value) => {
    const { calls, run } = setup();

    const outcome = await run(record(value));

    expect(outcome).toBe('dead-lettered');
    expect(calls.saves).toHaveLength(0);
    expect(calls.waits).toHaveLength(0);
    expect(calls.dlq).toHaveLength(1);
    expect(calls.order).toEqual(['dlq', 'commit']);
  });

  test('el mensaje que va al DLQ conserva el original y los headers de dónde salió', async () => {
    const { calls, run } = setup();
    const original = record(newsPayload({ schemaVersion: 2 }), 41);

    await run(original);

    const [sent] = calls.dlq;
    expect(sent.key).toEqual(original.key);
    expect(sent.value).toEqual(original.value);
    expect(sent.headers['x-error']).toContain('schemaVersion');
    expect(sent.headers['x-original-topic']).toBe('museum.events');
    expect(sent.headers['x-original-partition']).toBe('2');
    expect(sent.headers['x-original-offset']).toBe('41');
    expect(new Date(sent.headers['x-failed-at']).toString()).not.toBe('Invalid Date');
  });
});

describe('errores de la base', () => {
  test('un error de la base no confirma el offset y se reintenta con espera creciente hasta que la base vuelve', async () => {
    const { calls, run } = setup({ failSaves: 3 });

    const outcome = await run(record(newsPayload()));

    expect(outcome).toBe('saved');
    expect(calls.saves).toHaveLength(4);
    expect(calls.waits).toEqual([1000, 2000, 4000]);
    expect(calls.commitsAtSave).toEqual([0, 0, 0, 0]); // ningún commit mientras fallaba
    expect(calls.commits).toBe(1);
    expect(calls.dlq).toHaveLength(0);
  });

  test('si la base no vuelve antes del tope, el mensaje va al DLQ y recién ahí se confirma el offset', async () => {
    const { calls, run } = setup({ alwaysFail: true });

    const outcome = await run(record(newsPayload()));

    expect(outcome).toBe('dead-lettered');
    expect(calls.saves).toHaveLength(5);
    expect(calls.waits).toEqual([1000, 2000, 4000, 3000]); // la última se recorta al tope de 10 s
    expect(calls.dlq).toHaveLength(1);
    expect(calls.dlq[0].headers['x-error']).toMatch(/^db: .*ECONNREFUSED/);
    expect(calls.commitsAtSave.every((commits) => commits === 0)).toBe(true);
    expect(calls.order.slice(-2)).toEqual(['dlq', 'commit']);
  });

  test('si falla incluso el DLQ, el proceso se detiene sin confirmar el offset', async () => {
    const { calls, run } = setup({ dlqFails: true });

    await expect(run(record(newsPayload({ schemaVersion: 2 })))).rejects.toBeInstanceOf(FatalConsumerError);

    expect(calls.commits).toBe(0);
  });

  test('si falla el DLQ después de agotar los reintentos, tampoco se confirma el offset', async () => {
    const { calls, run } = setup({ alwaysFail: true, dlqFails: true });

    await expect(run(record(newsPayload()))).rejects.toBeInstanceOf(FatalConsumerError);

    expect(calls.commits).toBe(0);
  });
});