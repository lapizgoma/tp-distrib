"""Caso de uso para consultar eventos por sala."""

from app.generated import event_pb2

from .event_helpers import (
    fetch_event_rows,
    filter_rows_by_future,
    filter_rows_by_locations,
    filter_rows_by_window,
    row_to_event,
)


def get_events_by_locations(request) -> event_pb2.EventListResponse:
    """Devuelve eventos por sala, opcionalmente futuros y dentro de una ventana."""
    rows = filter_rows_by_locations(fetch_event_rows(), request.locations)
    if request.only_future:
        rows = filter_rows_by_future(rows)
    if request.start_datetime or request.end_datetime:
        rows = filter_rows_by_window(rows, request.start_datetime, request.end_datetime)
    return event_pb2.EventListResponse(events=[row_to_event(row) for row in rows])
