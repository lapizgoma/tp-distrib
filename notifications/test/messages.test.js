import { describe, test, expect } from '@jest/globals';
import { buildNotificationContent, parseNewsMessage } from '../src/messages.js';

const valid = (overrides = {}) => ({
  schemaVersion: 1,
  messageId: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
  newsType: 'EVENT_CREATED',
  eventId: 12,
  eventTitle: 'Noche de Gala en el Museo',
  eventDateTime: '2026-11-15T20:00:00',
  eventType: 'VISITA_GUIADA',
  leadCuratorId: 2,
  occurredAt: '2026-10-29T14:03:11Z',
  responsibleUserId: 5,
  source: 'backend-rest',
  ...overrides,
});

const asBuffer = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));

describe('lectura del mensaje de novedades', () => {
  test('un mensaje de alta válido se acepta y se queda con los campos que usa el consumidor', () => {
    const result = parseNewsMessage(asBuffer(valid()));

    expect(result).toEqual({
      ok: true,
      news: {
        messageId: '7f0c9d2e-4a1b-4c3d-9e8f-123456789abc',
        newsType: 'EVENT_CREATED',
        eventId: 12,
        eventTitle: 'Noche de Gala en el Museo',
      },
    });
  });

  test('un mensaje de modificación con changes se acepta y no usa los cambios', () => {
    const result = parseNewsMessage(
      asBuffer(
        valid({
          newsType: 'EVENT_UPDATED',
          changes: { eventTitle: { previous: 'A', current: 'B' } },
        }),
      ),
    );

    expect(result.ok).toBe(true);
    expect(result.news).not.toHaveProperty('changes');
  });

  test.each([
    ['el value es null', null],
    ['el JSON está roto', '{"schemaVersion":1,'],
    ['el JSON es un array', '[]'],
    ['falta el messageId', valid({ messageId: undefined })],
    ['el messageId está vacío', valid({ messageId: '' })],
    ['el messageId es más largo que la columna', valid({ messageId: 'x'.repeat(37) })],
    ['la schemaVersion es 2', valid({ schemaVersion: 2 })],
    ['falta la schemaVersion', valid({ schemaVersion: undefined })],
    ['el newsType no existe', valid({ newsType: 'EVENT_DELETED' })],
    ['el eventId no es un entero', valid({ eventId: '12' })],
    ['el eventId es cero', valid({ eventId: 0 })],
    ['falta el título del evento', valid({ eventTitle: undefined })],
    ['el título del evento es solo espacios', valid({ eventTitle: '   ' })],
    ['el título del evento supera los 255 caracteres', valid({ eventTitle: 'x'.repeat(256) })],
  ])('un mensaje inválido se rechaza cuando %s', (_caso, value) => {
    const raw = value === null ? null : asBuffer(value);

    const result = parseNewsMessage(raw);

    expect(result.ok).toBe(false);
    expect(result.error).toEqual(expect.any(String));
  });
});

describe('texto de la notificación', () => {
  test.each([
    ['EVENT_CREATED', 'Nuevo evento', 'Nuevo evento: Charla X'],
    ['EVENT_UPDATED', 'Evento modificado', 'Se modificó el evento Charla X'],
    ['EVENT_CANCELLED', 'Evento cancelado', 'Se canceló el evento Charla X'],
  ])('para %s el título es "%s" y el mensaje es "%s"', (newsType, title, message) => {
    expect(buildNotificationContent({ newsType, eventTitle: 'Charla X' })).toEqual({ title, message });
  });
});