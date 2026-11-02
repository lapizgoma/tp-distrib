"""Cálculo de la agenda horaria por sala del recorrido."""

import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta

from .tour_planner import WorkCandidate, canonical_location

LOCAL_DATETIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$")


class InvalidStartDatetime(ValueError):
    """La fecha de inicio no tiene el formato local esperado."""


@dataclass(frozen=True)
class RoomSlot:
    """Franja horaria asignada a una sala."""

    room: str
    start_datetime: str
    end_datetime: str


@dataclass(frozen=True)
class TourSchedule:
    """Agenda completa del recorrido."""

    start_datetime: str
    end_datetime: str
    room_schedule: tuple[RoomSlot, ...]


def format_local_datetime(value: datetime) -> str:
    """Formatea un datetime local sin zona horaria."""
    return value.strftime("%Y-%m-%dT%H:%M:%S")


def parse_local_datetime(value) -> datetime | None:
    """Parsea un datetime local sin zona y rechaza fechas normalizadas."""
    if not isinstance(value, str) or not LOCAL_DATETIME_RE.match(value):
        return None

    normalized = f"{value}:00" if len(value) == 16 else value
    try:
        parsed = datetime.strptime(normalized, "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        return None

    if format_local_datetime(parsed) != normalized:
        return None
    return parsed


def add_minutes(value: datetime, minutes: int) -> datetime:
    """Suma minutos a un datetime."""
    return value + timedelta(minutes=minutes)


def _duration_minutes(work: WorkCandidate) -> int:
    """Devuelve la duración de una obra, nunca negativa."""
    return max(0, int(work.estimated_duration_minutes))


def build_room_schedule(
    works: list[WorkCandidate],
    rooms: list[str],
    total_duration_minutes: int,
    start_datetime: str,
) -> TourSchedule:
    """Construye la agenda por sala desde el plan de works.

    La diferencia entre ``total_duration_minutes`` y la suma de obras son los
    traslados. Se reparten en partes iguales entre los cambios de sala, igual
    que el total calculado por ``calculate_total_duration``.
    """
    start = parse_local_datetime(start_datetime)
    if start is None:
        raise InvalidStartDatetime(
            "start_datetime debe tener formato YYYY-MM-DDTHH:mm",
        )

    room_list = [canonical_location(room) for room in rooms if canonical_location(room)]
    works_by_room: dict[str, list[WorkCandidate]] = {}
    for work in works:
        room = canonical_location(work.location)
        works_by_room.setdefault(room, []).append(work)

    works_minutes = sum(_duration_minutes(work) for work in works)
    total_minutes = max(works_minutes, max(0, int(total_duration_minutes)))
    transition_total = max(0, total_minutes - works_minutes)
    if len(room_list) > 1:
        # Math.round de JavaScript: floor(x + 0.5) para valores positivos.
        step = math.floor(transition_total / (len(room_list) - 1) + 0.5)
    else:
        step = 0

    cursor = start
    schedule: list[RoomSlot] = []
    for index, room in enumerate(room_list):
        duration = sum(
            _duration_minutes(work)
            for work in works_by_room.get(room, [])
        )
        room_start = cursor
        room_end = add_minutes(room_start, duration)

        cursor = (
            add_minutes(room_end, step)
            if index < len(room_list) - 1
            else room_end
        )

        schedule.append(
            RoomSlot(
                room=room,
                start_datetime=format_local_datetime(room_start),
                end_datetime=format_local_datetime(room_end),
            ),
        )

    return TourSchedule(
        start_datetime=format_local_datetime(start),
        end_datetime=format_local_datetime(cursor),
        room_schedule=tuple(schedule),
    )
