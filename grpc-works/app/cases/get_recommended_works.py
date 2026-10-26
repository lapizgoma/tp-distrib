import random
from datetime import datetime, timedelta

from app.db import fetch_all, fetch_one
from app.generated import work_pb2

from .search_works_for_tour import candidate_to_proto, row_to_candidate
from .tour_planner import (
    canonical_era,
    canonical_technique,
    normalize_text,
    parse_topics,
)

RECENT_DAYS = 7
VIEW_SCORE = 1
COMMENT_SCORE = 3
RECENT_BONUS = 1

INTERACTION_SCORES = {
    "VIEW": VIEW_SCORE,
    "COMMENT": COMMENT_SCORE,
}

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

INTERACTIONS_QUERY = """
    SELECT
        uwi.work_id,
        uwi.interaction_type,
        uwi.created_at,
        COALESCE(w.technique, '') AS technique,
        COALESCE(w.era, '') AS era
    FROM user_work_interactions uwi
    JOIN works w ON w.id = uwi.work_id
    WHERE uwi.user_id = %s
"""

PREFERENCES_QUERY = """
    SELECT favorite_topics, favorite_techniques, favorite_eras
    FROM user_preferences
    WHERE user_id = %s
"""


def interaction_score(work, interactions, now: datetime) -> int:
    """Suma puntos por interacciones en obras de la misma técnica y era.

    Una vista suma VIEW_SCORE; un comentario suma COMMENT_SCORE. Cada
    interacción reciente suma RECENT_BONUS.
    """
    technique = canonical_technique(work.technique)
    era = canonical_era(work.era)
    if not technique or not era:
        return 0

    total = 0
    for interaction in interactions:
        if canonical_technique(interaction.get("technique")) != technique:
            continue
        if canonical_era(interaction.get("era")) != era:
            continue

        interaction_type = str(interaction.get("interaction_type") or "").strip().upper()
        points = INTERACTION_SCORES.get(interaction_type, 0)
        if points == 0:
            continue

        total += points

        # Indica si la interacción ocurrió en los últimos RECENT_DAYS días.
        created_at = interaction.get("created_at")
        if isinstance(created_at, datetime) and created_at >= now - timedelta(days=RECENT_DAYS):
            total += RECENT_BONUS

    return total


def preference_score(work, preferences: dict | None) -> int:
    """Suma un punto por cada coincidencia entre preferencias y obra.

    Los topics se comparan uno a uno; la técnica y la era se comparan una vez.
    Sin preferencias para el usuario no se suma nada.
    """
    if not preferences:
        return 0

    favorite_topics = {
        normalize_text(value) for value in parse_topics(preferences.get("favorite_topics"))
    }
    favorite_techniques = {
        canonical_technique(value) for value in parse_topics(preferences.get("favorite_techniques"))
    }
    favorite_eras = {
        canonical_era(value) for value in parse_topics(preferences.get("favorite_eras"))
    }

    total = sum(1 for topic in work.topics if topic in favorite_topics)
    total += 1 if canonical_technique(work.technique) in favorite_techniques else 0
    total += 1 if canonical_era(work.era) in favorite_eras else 0
    return total


def score_work(work, interactions, preferences, now: datetime) -> int:
    """Calcula el puntaje total de una obra."""
    return interaction_score(work, interactions, now) + preference_score(
        work, preferences
    )


def get_recommended_works(request) -> work_pb2.WorkListResponse:
    """Devuelve las obras con mayor puntaje, en orden aleatorio.

    El puntaje combina interacciones en obras de la misma técnica y era con
    coincidencias de user_preferences. El límite menor o igual a cero devuelve
    una lista vacía.
    """

    user_id = request.user_id
    # Carga todas las obras desde MySQL.
    works = [row_to_candidate(row) for row in fetch_all(WORKS_QUERY)]
    # Carga las interacciones del usuario junto con técnica y era de la obra.
    interactions = fetch_all(INTERACTIONS_QUERY, (user_id,))
    # Carga las preferencias del usuario, o None si no tiene fila.
    preferences = fetch_one(PREFERENCES_QUERY, (user_id,))
    now = datetime.now()

    ranked = sorted(
        works,
        key=lambda work: (-score_work(work, interactions, preferences, now), work.id),
    )
    selected = ranked[: max(0, request.limit)]
    random.shuffle(selected)

    return work_pb2.WorkListResponse(
        works=[candidate_to_proto(work) for work in selected]
    )
