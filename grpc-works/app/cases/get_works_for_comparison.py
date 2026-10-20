"""Consulta las obras pedidas y arma la respuesta de la comparación."""

from app.db import fetch_all
from app.generated import work_pb2

MIN_WORKS = 2
MAX_WORKS = 10


class InvalidComparisonRequest(ValueError):
    """El pedido no cumple las reglas mínimas para comparar."""


class WorksNotFound(LookupError):
    """No se encontraron suficientes obras para comparar."""


# A diferencia del recorrido, NO se filtra por disponibilidad: se pueden
# comparar obras que están en depósito.
WORKS_BY_IDS_QUERY = """
    SELECT
        w.id,
        w.title,
        w.artist_id,
        a.name AS artist_name,
        w.image_url,
        COALESCE(w.creation_year, 0) AS creation_year,
        COALESCE(w.technique, '') AS technique,
        COALESCE(w.dimensions, '') AS dimensions,
        COALESCE(w.era, '') AS era,
        COALESCE(w.topics, '') AS topics,
        COALESCE(w.description, '') AS description,
        COALESCE(w.location, '') AS location,
        w.availability,
        COALESCE(w.estimated_duration_minutes, 10) AS estimated_duration_minutes
    FROM works w
    JOIN artists a ON a.id = w.artist_id
    WHERE w.id IN ({placeholders})
"""


def normalize_ids(work_ids) -> list[int]:
    """Quita ids repetidos conservando el orden en que se pidieron."""
    seen = set()
    ordered = []
    for work_id in work_ids:
        if work_id not in seen:
            seen.add(work_id)
            ordered.append(int(work_id))
    return ordered


def row_to_proto(row: dict) -> work_pb2.Work:
    """Convierte una fila de MySQL en el mensaje protobuf Work."""
    return work_pb2.Work(
        id=int(row["id"]),
        title=row.get("title") or "",
        artist_id=int(row.get("artist_id") or 0),
        artist_name=row.get("artist_name") or "",
        image_url=row.get("image_url") or "",
        creation_year=int(row.get("creation_year") or 0),
        technique=row.get("technique") or "",
        dimensions=row.get("dimensions") or "",
        era=row.get("era") or "",
        topic=row.get("topics") or "",
        description=row.get("description") or "",
        location=row.get("location") or "",
        availability=row.get("availability") or "",
        estimated_duration_minutes=int(row.get("estimated_duration_minutes") or 10),
    )


def get_works_for_comparison(request) -> work_pb2.WorkListResponse:
    """Devuelve las obras pedidas, en el mismo orden en que se pidieron.

    - Ids repetidos se ignoran.
    - Con menos de MIN_WORKS ids distintos o más de MAX_WORKS lanza
      InvalidComparisonRequest.
    - Los ids que no existen se omiten; si quedan menos de MIN_WORKS obras
      lanza WorksNotFound. El cliente puede detectar los ids faltantes
      comparando contra los que pidió.
    """
    ids = normalize_ids(request.work_ids)

    if len(ids) < MIN_WORKS:
        raise InvalidComparisonRequest(
            f"at least {MIN_WORKS} distinct work ids are required"
        )
    if len(ids) > MAX_WORKS:
        raise InvalidComparisonRequest(
            f"at most {MAX_WORKS} works can be compared at once"
        )

    placeholders = ", ".join(["%s"] * len(ids))
    rows = fetch_all(
        WORKS_BY_IDS_QUERY.format(placeholders=placeholders),
        tuple(ids),
    )

    # MySQL no garantiza el orden de IN (...): se reordena según el pedido.
    rows_by_id = {int(row["id"]): row for row in rows}
    found = [rows_by_id[work_id] for work_id in ids if work_id in rows_by_id]

    if len(found) < MIN_WORKS:
        missing = [work_id for work_id in ids if work_id not in rows_by_id]
        raise WorksNotFound(
            f"not enough works found to compare (missing ids: {missing})"
        )

    return work_pb2.WorkListResponse(works=[row_to_proto(row) for row in found])