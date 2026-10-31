// Filas por INSERT multi-fila
const CHUNK_SIZE = 100;

const SELECT_VISITORS = "SELECT id FROM users WHERE role = 'VISITANTE' ORDER BY id";
const SELECT_REGISTERED =
  'SELECT user_id AS id FROM events_registrations WHERE event_id = ? ORDER BY user_id';

// La clave unica (message_id, user_id) absorbe los duplicados: si la fila ya
// existe, no cambia nada. Se usa esto y no INSERT IGNORE para que otros errores
// (por ejemplo la FK de user_id) no queden tapados.
const INSERT_NOTIFICATIONS = `
INSERT INTO notifications (message_id, user_id, event_id, news_type, title, message, created_at)
VALUES ?
ON DUPLICATE KEY UPDATE id = id`;

export function createNotificationsRepository(pool, { chunkSize = CHUNK_SIZE } = {}) {
  // Alta: todos los visitantes. Modificacion y cancelacion: los inscriptos al evento.
  // Los destinatarios se resuelven ahora, al procesar, no al publicar.
  async function findRecipientIds(connection, news) {
    const [rows] =
      news.newsType === 'EVENT_CREATED'
        ? await connection.query(SELECT_VISITORS)
        : await connection.query(SELECT_REGISTERED, [news.eventId]);
    return rows.map((row) => Number(row.id));
  }

  // Todas las notificaciones del mensaje van en UNA transaccion: o se guardan
  // todas o ninguna. Recien despues de este commit se confirma el offset.
  async function saveNotifications({ news, content, createdAt }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const recipientIds = await findRecipientIds(connection, news);
      for (let i = 0; i < recipientIds.length; i += chunkSize) {
        const rows = recipientIds
          .slice(i, i + chunkSize)
          .map((userId) => [
            news.messageId,
            userId,
            news.eventId,
            news.newsType,
            content.title,
            content.message,
            createdAt,
          ]);
        await connection.query(INSERT_NOTIFICATIONS, [rows]);
      }

      await connection.commit();
      return { recipients: recipientIds.length };
    } catch (err) {
      try {
        await connection.rollback();
      } catch {
        // la conexion ya se perdio: MySQL descarta la transaccion abierta
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  return { saveNotifications };
}