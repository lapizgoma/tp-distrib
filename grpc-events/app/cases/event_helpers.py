"""Consultas y conversiones compartidas por los casos de eventos."""

from datetime import datetime

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
