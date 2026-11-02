export const SUPPORTED_SCHEMA_VERSION = 1;
export const NEWS_TYPES = ['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELLED'];

// Largos de las columnas de notifications (message_id CHAR(36), title de evento <= 255)
const MAX_MESSAGE_ID_LENGTH = 36;
const MAX_EVENT_TITLE_LENGTH = 255;

const CONTENT_BY_TYPE = {
  EVENT_CREATED: { title: 'Nuevo evento', text: (eventTitle) => `Nuevo evento: ${eventTitle}` },
  EVENT_UPDATED: { title: 'Evento modificado', text: (eventTitle) => `Se modificó el evento ${eventTitle}` },
  EVENT_CANCELLED: { title: 'Evento cancelado', text: (eventTitle) => `Se canceló el evento ${eventTitle}` },
};

function invalid(error) {
  return { ok: false, error };
}

// raw es el value del registro de Kafka (Buffer) o null.
// Devuelve { ok: true, news } con solo los campos que usa este consumidor,
// o { ok: false, error } si el mensaje no se puede procesar nunca.
export function parseNewsMessage(raw) {
  if (raw === null || raw === undefined || raw.length === 0) {
    return invalid('mensaje vacio');
  }

  let data;
  try {
    data = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    return invalid(`json invalido: ${err.message}`);
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return invalid('el mensaje no es un objeto JSON');
  }
  if (data.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return invalid(`schemaVersion no soportada: ${JSON.stringify(data.schemaVersion)}`);
  }
  if (
    typeof data.messageId !== 'string' ||
    data.messageId.length === 0 ||
    data.messageId.length > MAX_MESSAGE_ID_LENGTH
  ) {
    return invalid('messageId ausente o invalido');
  }
  if (!NEWS_TYPES.includes(data.newsType)) {
    return invalid(`newsType desconocido: ${JSON.stringify(data.newsType)}`);
  }
  if (!Number.isSafeInteger(data.eventId) || data.eventId <= 0) {
    return invalid('eventId ausente o invalido');
  }
  if (
    typeof data.eventTitle !== 'string' ||
    data.eventTitle.trim() === '' ||
    data.eventTitle.length > MAX_EVENT_TITLE_LENGTH
  ) {
    return invalid('eventTitle ausente o invalido');
  }

  return {
    ok: true,
    news: {
      messageId: data.messageId,
      newsType: data.newsType,
      eventId: data.eventId,
      eventTitle: data.eventTitle,
    },
  };
}

// Texto generico segun el tipo; no usa `changes`.
export function buildNotificationContent(news) {
  const content = CONTENT_BY_TYPE[news.newsType];
  return { title: content.title, message: content.text(news.eventTitle) };
}