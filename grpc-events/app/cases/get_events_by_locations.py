"""Caso de uso para consultar eventos por sala."""

from app.generated import event_pb2

from .event_helpers import (
    fetch_event_rows,
    filter_rows_by_future,
    filter_rows_by_locations,
    row_to_event,
)


def get_events_by_locations(request) -> event_pb2.EventListResponse:
    """Devuelve los eventos ubicados en alguna de las salas solicitadas."""
    rows = filter_rows_by_locations(fetch_event_rows(), request.locations)
    if request.only_future:
        rows = filter_rows_by_future(rows)
    return event_pb2.EventListResponse(events=[row_to_event(row) for row in rows])
