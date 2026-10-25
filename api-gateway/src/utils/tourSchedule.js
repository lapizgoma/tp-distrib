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

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function normalizeRoomCode(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function minutes(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

/**
 * Construye la agenda por sala desde el plan de works.
 * La diferencia entre total_duration_minutes y la suma de obras son los traslados.
 */
export function buildRoomSchedule(plan, startDatetime) {
  const start = parseLocalDateTime(startDatetime);
  if (!start) return null;

  const rooms = Array.isArray(plan.rooms) ? plan.rooms : [];
  const works = Array.isArray(plan.works) ? plan.works : [];

  const worksByRoom = new Map();
  for (const work of works) {
    const room = normalizeRoomCode(work.location);
    const roomWorks = worksByRoom.get(room) ?? [];
    roomWorks.push(work);
    worksByRoom.set(room, roomWorks);
  }

  const worksMinutes = works.reduce(
    (total, work) => total + minutes(work.estimated_duration_minutes),
    0,
  );
  const totalMinutes = Math.max(worksMinutes, minutes(plan.total_duration_minutes));
  const transitionTotal = Math.max(0, totalMinutes - worksMinutes);
  const transitionMinutes = rooms.length > 1
    ? Math.round(transitionTotal / (rooms.length - 1))
    : 0;

  let cursor = new Date(start);
  const roomSchedule = rooms.map((room, index) => {
    const duration = (worksByRoom.get(normalizeRoomCode(room)) ?? []).reduce(
      (total, work) => total + minutes(work.estimated_duration_minutes),
      0,
    );
    const roomStart = new Date(cursor);
    const roomEnd = addMinutes(roomStart, duration);

    cursor = index < rooms.length - 1
      ? addMinutes(roomEnd, transitionMinutes)
      : roomEnd;

    return {
      room,
      start_datetime: formatLocalDateTime(roomStart),
      end_datetime: formatLocalDateTime(roomEnd),
    };
  });

  return {
    start_datetime: formatLocalDateTime(start),
    end_datetime: formatLocalDateTime(cursor),
    room_schedule: roomSchedule,
  };
}

function eventWindow(event) {
  const start = parseLocalDateTime(event.datetime);
  if (!start) return null;

  return {
    start,
    end: addMinutes(start, minutes(event.duration)),
    duration: minutes(event.duration),
  };
}

/** Deja solo eventos que se solapan con la franja de su sala. */
export function filterEventsBySchedule(events, roomSchedule) {
  const scheduleByRoom = new Map(
    roomSchedule.map((slot) => [normalizeRoomCode(slot.room), slot]),
  );

  return events.filter((event) => {
    const slot = scheduleByRoom.get(normalizeRoomCode(event.location));
    if (!slot) return false;

    const window = eventWindow(event);
    const slotStart = parseLocalDateTime(slot.start_datetime);
    const slotEnd = parseLocalDateTime(slot.end_datetime);
    if (!window || !slotStart || !slotEnd) return false;

    if (window.duration === 0) {
      return window.start >= slotStart && window.start < slotEnd;
    }

    return window.start < slotEnd && window.end > slotStart;
  });
}

export function isValidStartDatetime(value) {
  return parseLocalDateTime(value) !== null;
}
