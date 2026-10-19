"""Consulta las obras disponibles y arma la respuesta del tour."""

import os

from app.db import fetch_all
from app.generated import work_pb2

from .tour_planner import (
    ROOM_TRANSITION_MINUTES,
    WorkCandidate,
    parse_topics,
    plan_tour,
)

WORKS_QUERY = """
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
    WHERE w.availability = 'EN_EXHIBICION'
    ORDER BY w.id
"""


def _room_transition_minutes() -> int:
    """Lee los minutos de traslado entre salas desde el entorno."""
    raw_value = os.getenv("ROOM_TRANSITION_MINUTES")
    if raw_value is None or raw_value.strip() == "":
        return ROOM_TRANSITION_MINUTES
    try:
        return max(0, int(raw_value))
    except ValueError:
        return ROOM_TRANSITION_MINUTES


def row_to_candidate(row: dict) -> WorkCandidate:
    """Convierte una fila de MySQL en un WorkCandidate normalizado."""
    raw_topics = row.get("topics") or ""
    return WorkCandidate(
        id=int(row["id"]),
        title=row.get("title") or "",
        artist_id=int(row.get("artist_id") or 0),
        artist_name=row.get("artist_name") or "",
        image_url=row.get("image_url") or "",
        creation_year=int(row.get("creation_year") or 0),
        technique=row.get("technique") or "",
        dimensions=row.get("dimensions") or "",
        era=row.get("era") or "",
        topic=raw_topics,
        topics=parse_topics(raw_topics),
        description=row.get("description") or "",
        location=row.get("location") or "",
        availability=row.get("availability") or "",
        estimated_duration_minutes=int(row.get("estimated_duration_minutes") or 10),
    )


def candidate_to_proto(work: WorkCandidate) -> work_pb2.Work:
    """Convierte un WorkCandidate en el mensaje protobuf Work."""
    return work_pb2.Work(
        id=work.id,
        title=work.title,
        artist_id=work.artist_id,
        artist_name=work.artist_name,
        image_url=work.image_url,
        creation_year=work.creation_year,
        technique=work.technique,
        dimensions=work.dimensions,
        era=work.era,
        topic=work.topic,
        description=work.description,
        location=work.location,
        availability=work.availability,
        estimated_duration_minutes=work.estimated_duration_minutes,
    )


def fetch_work_candidates() -> list[WorkCandidate]:
    """Carga las obras en exhibición desde MySQL."""
    return [row_to_candidate(row) for row in fetch_all(WORKS_QUERY)]


def search_works_for_tour(request) -> work_pb2.WorkListResponse:
    """Filtra y ordena las obras para responder un TourCriteriaRequest.

    Delega la selección en ``plan_tour`` usando los filtros y límites del request.
    """
    candidates = fetch_work_candidates()
    selected = plan_tour(
        candidates,
        topics=request.topics,
        eras=request.eras,
        techniques=request.techniques,
        max_duration_minutes=request.max_duration_minutes,
        max_works_count=request.max_works_count,
        transition_minutes=_room_transition_minutes(),
    )
    return work_pb2.WorkListResponse(
        works=[candidate_to_proto(work) for work in selected],
    )
