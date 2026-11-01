const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatLocalDateTime(date) {
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}

/** Parsea un datetime local sin zona y rechaza fechas normalizadas por Date. */
export function parseLocalDateTime(value) {
  if (typeof value !== 'string' || !LOCAL_DATETIME_RE.test(value)) return null;

  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime()) || formatLocalDateTime(date) !== normalized) {
    return null;
  }
  return date;
}

export function isValidStartDatetime(value) {
  return parseLocalDateTime(value) !== null;
}
