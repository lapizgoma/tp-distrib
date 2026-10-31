import { buildNotificationContent, parseNewsMessage } from './messages.js';

// Se lanza cuando no se puede ni guardar ni mandar al DLQ: no hay forma segura
// de seguir sin perder el mensaje. El proceso se detiene sin confirmar el offset.
export class FatalConsumerError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'FatalConsumerError';
  }
}

class RetriesExhaustedError extends Error {
  constructor(cause, attempts) {
    super(`reintentos agotados tras ${attempts} intentos: ${cause.message}`, { cause });
    this.name = 'RetriesExhaustedError';
  }
}

// Todo se inyecta (repositorio, DLQ, espera, reloj) para poder testear la
// logica sin Kafka ni MySQL.
//
// handle({ message, heartbeat, commit }):
//   - 'saved':         notificaciones guardadas, offset confirmado.
//   - 'dead-lettered': mensaje invalido o reintentos agotados; copiado al DLQ
//                      y offset confirmado.
//   - lanza FatalConsumerError si ni el DLQ responde (offset sin confirmar).
export function createMessageHandler({ repository, sendToDlq, wait, retry, logger, now = Date.now }) {
  async function deadLetter(message, cause, messageId) {
    logger.error(
      `mensaje al DLQ messageId=${messageId ?? '-'} partition=${message.partition} offset=${message.offset}: ${cause}`,
    );
    try {
      await sendToDlq({
        key: message.key,
        value: message.value,
        headers: {
          'x-error': cause,
          'x-original-topic': message.topic,
          'x-original-partition': String(message.partition),
          'x-original-offset': String(message.offset),
          'x-failed-at': new Date(now()).toISOString(),
        },
      });
    } catch (err) {
      throw new FatalConsumerError(
        `no se pudo escribir en el DLQ (partition=${message.partition} offset=${message.offset}): ${err.message}`,
        { cause: err },
      );
    }
  }

  // Reintenta mientras la base no responda, con espera creciente, hasta el tope.
  // Mientras reintenta NO se confirma el offset.
  async function saveWithRetry(news, content, heartbeat) {
    const startedAt = now();
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        return await repository.saveNotifications({ news, content, createdAt: new Date(now()) });
      } catch (err) {
        const elapsed = now() - startedAt;
        if (elapsed >= retry.totalMs) {
          throw new RetriesExhaustedError(err, attempt);
        }
        const delay = Math.min(
          retry.initialMs * 2 ** (attempt - 1),
          retry.maxDelayMs,
          retry.totalMs - elapsed,
        );
        logger.warn(
          `no se pudo guardar messageId=${news.messageId} intento ${attempt}: ${err.message}. Reintento en ${delay} ms`,
        );
        await wait(delay, heartbeat);
      }
    }
  }

  return async function handle({ message, heartbeat, commit }) {
    const parsed = parseNewsMessage(message.value);
    if (!parsed.ok) {
      await deadLetter(message, parsed.error);
      await commit();
      return 'dead-lettered';
    }

    const { news } = parsed;
    const content = buildNotificationContent(news);

    let saved;
    try {
      saved = await saveWithRetry(news, content, heartbeat);
    } catch (err) {
      if (!(err instanceof RetriesExhaustedError)) throw err;
      await deadLetter(message, `db: ${err.cause.message}`, news.messageId);
      await commit();
      return 'dead-lettered';
    }

    // Recien ahora, con todo commiteado en MySQL, se confirma el offset.
    await commit();
    logger.info(
      `notificado messageId=${news.messageId} newsType=${news.newsType} eventId=${news.eventId} ` +
        `destinatarios=${saved.recipients} partition=${message.partition} offset=${message.offset}`,
    );
    return 'saved';
  };
}