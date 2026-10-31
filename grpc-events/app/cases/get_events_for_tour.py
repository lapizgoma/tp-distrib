"""Caso de uso para consultar eventos dentro de la agenda de un recorrido."""

from app.generated import event_pb2

from .event_helpers import (
    fetch_event_rows,
    filter_rows_by_room_schedule,
    row_to_event,
)


def get_events_for_tour(request) -> event_pb2.EventListResponse:
    """Devuelve los eventos que solapan la franja horaria de cada sala."""
    rows = filter_rows_by_room_schedule(
        fetch_event_rows(),
        request.room_schedule,
    )
    return event_pb2.EventListResponse(events=[row_to_event(row) for row in rows])
