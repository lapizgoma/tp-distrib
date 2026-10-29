"""Consultas y conversiones compartidas por los casos de eventos."""

from datetime import datetime, timedelta

from app.db import fetch_all
from app.generated import event_pb2
from app.normalization import canonical_era, canonical_location, normalize_text

EVENTS_QUERY = """
    SELECT
        id,
        COALESCE(title, '') AS title,
        COALESCE(description, '') AS description,
        datetime,
        COALESCE(duration, 0) AS duration,
        COALESCE(location, '') AS location,
        COALESCE(event_type, '') AS event_type,
        COALESCE(associated_era, '') AS associated_era
    FROM events
    WHERE is_deleted = 0
    ORDER BY datetime, id
"""


def fetch_event_rows() -> list[dict]:
    """Obtiene todos los eventos ordenados por fecha e id."""
    return fetch_all(EVENTS_QUERY)


def format_datetime(value) -> str:
    """Formatea la fecha como ISO 8601 sin zona horaria."""
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%dT%H:%M:%S")
    text = str(value).strip()
    if "T" not in text and " " in text:
        return text.replace(" ", "T", 1)
    return text


def parse_datetime(value) -> datetime | None:
    """Convierte un valor de fecha en datetime; devuelve None si no se puede."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace(" ", "T", 1))
    except ValueError:
        return None


def filter_rows_by_future(
    rows: list[dict],
    now: datetime | None = None,
) -> list[dict]:
    """Filtra eventos cuya fecha es igual o posterior a ``now``."""
    reference = now or datetime.now()
    filtered = []
    for row in rows:
        event_datetime = parse_datetime(row.get("datetime"))
        if event_datetime is not None and event_datetime >= reference:
            filtered.append(row)
    return filtered


def _duration_minutes(row: dict) -> int:
    """Devuelve la duración del evento en minutos, nunca negativa."""
    try:
        return max(0, int(row.get("duration") or 0))
    except (TypeError, ValueError):
        return 0


def filter_rows_by_window(
    rows: list[dict],
    start_datetime,
    end_datetime,
) -> list[dict]:
    """Filtra eventos que se solapan con la ventana indicada.

    Un evento sin duración cuenta solo si empieza dentro de la ventana.
    """
    window_start = parse_datetime(start_datetime)
    window_end = parse_datetime(end_datetime)
    if window_start is None or window_end is None or window_end <= window_start:
        return []

    filtered = []
    for row in rows:
        event_start = parse_datetime(row.get("datetime"))
        if event_start is None:
            continue

        duration = _duration_minutes(row)
        if duration == 0:
            if window_start <= event_start < window_end:
                filtered.append(row)
            continue

        event_end = event_start + timedelta(minutes=duration)
        if event_start < window_end and event_end > window_start:
            filtered.append(row)

    return filtered


def row_to_event(row: dict) -> event_pb2.Event:
    """Convierte una fila de MySQL en un mensaje protobuf Event."""
    return event_pb2.Event(
        id=int(row.get("id") or 0),
        title=row.get("title") or "",
        description=row.get("description") or "",
        datetime=format_datetime(row.get("datetime")),
        duration=int(row.get("duration") or 0),
        location=row.get("location") or "",
        event_type=row.get("event_type") or "",
        associated_era=row.get("associated_era") or "",
    )


def filter_rows_by_locations(rows: list[dict], locations) -> list[dict]:
    """Filtra eventos por sala usando nombres canónicos."""
    wanted = {
        canonical_location(location)
        for location in locations
        if normalize_text(location)
    }
    if not wanted:
        return []
    return [
        row
        for row in rows
        if canonical_location(row.get("location")) in wanted
    ]


def filter_rows_by_era(rows: list[dict], era) -> list[dict]:
    """Filtra eventos por era usando su alias canónico."""
    wanted = canonical_era(era)
    if not wanted:
        return []
    return [
        row
        for row in rows
        if canonical_era(row.get("associated_era")) == wanted
    ]
