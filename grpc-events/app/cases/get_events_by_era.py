"""Caso de uso para consultar eventos por era."""

from app.generated import event_pb2

from .event_helpers import fetch_event_rows, filter_rows_by_era, row_to_event


def get_events_by_era(request) -> event_pb2.EventListResponse:
    """Devuelve los eventos cuya era coincide con la solicitada."""
    rows = filter_rows_by_era(fetch_event_rows(), request.era)
    return event_pb2.EventListResponse(events=[row_to_event(row) for row in rows])
