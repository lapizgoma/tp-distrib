import json
import os
import random
import re
from datetime import datetime, timedelta

import grpc
from app.db import fetch_all
from app.generated import user_pb2, user_pb2_grpc, work_pb2

from .search_works_for_tour import candidate_to_proto, row_to_candidate
from .tour_planner import (
    canonical_era,
    canonical_technique,
    normalize_text,
    parse_topics,
)

RECENT_DAYS = 7
VIEW_SCORE = 1
COMMENT_SCORE = 2
RECENT_BONUS = 1
TECHNIQUE_BONUS = 3
ERA_BONUS = 3

INTERACTION_SCORES = {
    "VIEW": VIEW_SCORE,
    "COMMENT": COMMENT_SCORE,
}

TECHNIQUE_LABELS = {
    "oleo": "Óleo",
    "acrilico": "Acrílico",
    "acuarela": "Acuarela",
    "temple": "Temple",
    "escultura": "Escultura",
    "fotografia": "Fotografía",
}

ERA_LABELS = {
    "renacimiento": "Renacimiento",
    "barroco": "Barroco",
    "impresionismo": "Impresionismo",
    "vanguardia": "Vanguardia",
    "contemporaneo": "Contemporáneo",
}

# Consultamos ÚNICAMENTE las obras desde la base de datos propia de grpc-works
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


def _get_user_profile_via_grpc(user_id: int) -> tuple[dict | None, list[dict]]:
    """Consulta las preferencias e interacciones llamando a grpc-users vía gRPC."""
    users_service_host = os.getenv("GRPC_USERS_HOST", "localhost:50051")

    try:
        with grpc.insecure_channel(users_service_host) as channel:
            stub = user_pb2_grpc.UserServiceStub(channel)
            response = stub.GetUserProfile(
                user_pb2.UserProfileRequest(user_id=user_id)
            )

            preferences = None
            if response.HasField("preferences"):
                preferences = {
                    "favorite_topics": list(response.preferences.favorite_topics),
                    "favorite_techniques": list(
                        response.preferences.favorite_techniques
                    ),
                    "favorite_eras": list(response.preferences.favorite_eras),
                }

            interactions = []
            for inter in response.interactions:
                created_at_dt = None
                if inter.created_at:
                    try:
                        created_at_dt = datetime.fromisoformat(inter.created_at)
                    except ValueError:
                        created_at_dt = None

                interactions.append(
                    {
                        "work_id": inter.work_id,
                        "interaction_type": inter.interaction_type,
                        "created_at": created_at_dt,
                    }
                )

            return preferences, interactions

    except Exception as e:
        print(
            f"[gRPC Error] No se pudo consultar grpc-users para user_id {user_id}: {e}"
        )
        return None, []


def _favorite_sets(preferences: dict | None) -> tuple[set[str], set[str], set[str]]:
    """Devuelve los topics, técnicas y eras favoritos ya normalizados."""
    if not preferences:
        return set(), set(), set()

    return (
        {
            normalize_text(value)
            for value in parse_topics(preferences.get("favorite_topics"))
        },
        {
            canonical_technique(value)
            for value in parse_topics(preferences.get("favorite_techniques"))
        },
        {
            canonical_era(value)
            for value in parse_topics(preferences.get("favorite_eras"))
        },
    )


def _technique_label(value) -> str:
    """Devuelve el nombre visible de una técnica."""
    canonical = canonical_technique(value)
    return TECHNIQUE_LABELS.get(canonical, canonical.capitalize())


def _era_label(value) -> str:
    """Devuelve el nombre visible de una era."""
    canonical = canonical_era(value)
    return ERA_LABELS.get(canonical, canonical.capitalize())


def _raw_topic_labels(raw) -> dict[str, str]:
    """Mapea cada topic normalizado a su texto original, con acentos."""
    if isinstance(raw, (list, tuple, set)):
        values = [str(value) for value in raw]
    else:
        text = str(raw or "").strip()
        values = []
        if text.startswith("["):
            try:
                decoded = json.loads(text)
            except (TypeError, ValueError):
                decoded = None
            if isinstance(decoded, list):
                values = [str(value) for value in decoded]
        if not values:
            values = re.split(r"[,;|]", text)

    labels = {}
    for value in values:
        label = value.strip()
        normalized = normalize_text(label)
        if normalized:
            labels.setdefault(normalized, label)
    return labels


def _topic_label(work, topic: str) -> str:
    """Devuelve el topic con su texto original o capitalizado si falta."""
    label = _raw_topic_labels(getattr(work, "topic", "")).get(topic)
    return label or topic.capitalize()


def _interaction_matches(work, interaction, works_by_id: dict) -> bool:
    """Indica si la interacción comparte técnica y era con la obra actual."""
    technique = canonical_technique(work.technique)
    era = canonical_era(work.era)
    if not technique or not era:
        return False

    interacted_work = works_by_id.get(interaction.get("work_id"))
    if not interacted_work:
        return False

    return (
        canonical_technique(interacted_work.technique) == technique
        and canonical_era(interacted_work.era) == era
    )


def interaction_score(work, interactions, works_by_id: dict, now: datetime) -> int:
    """Suma puntos por interacciones en obras de la misma técnica y era."""
    total = 0
    for interaction in interactions:
        if not _interaction_matches(work, interaction, works_by_id):
            continue

        interaction_type = (
            str(interaction.get("interaction_type") or "").strip().upper()
        )
        points = INTERACTION_SCORES.get(interaction_type, 0)
        if points == 0:
            continue

        total += points

        created_at = interaction.get("created_at")
        if isinstance(created_at, datetime) and created_at >= now - timedelta(
            days=RECENT_DAYS
        ):
            total += RECENT_BONUS

    return total


def preference_score(work, preferences: dict | None) -> int:
    """Suma un punto por cada coincidencia entre preferencias y obra."""
    favorite_topics, favorite_techniques, favorite_eras = _favorite_sets(
        preferences
    )

    total = sum(1 for topic in work.topics if topic in favorite_topics)
    total += (
        TECHNIQUE_BONUS
        if canonical_technique(work.technique) in favorite_techniques
        else 0
    )
    total += ERA_BONUS if canonical_era(work.era) in favorite_eras else 0
    return total


def preference_reasons(work, preferences: dict | None) -> set[str]:
    """Explica cada coincidencia con las preferencias del visitante."""
    favorite_topics, favorite_techniques, favorite_eras = _favorite_sets(
        preferences
    )
    reasons = set()

    for topic in work.topics:
        if topic in favorite_topics:
            reasons.add(f"Coincide con tu interés en {_topic_label(work, topic)}")

    if canonical_technique(work.technique) in favorite_techniques:
        reasons.add(
            f"Coincide con tu técnica favorita: {_technique_label(work.technique)}"
        )

    if canonical_era(work.era) in favorite_eras:
        reasons.add(f"Coincide con tu era favorita: {_era_label(work.era)}")

    return reasons


def interaction_reasons(work, interactions, works_by_id: dict) -> set[str]:
    """Explica los comentarios previos en obras de la misma técnica o era."""
    reasons = set()
    for interaction in interactions:
        if not _interaction_matches(work, interaction, works_by_id):
            continue

        interaction_type = (
            str(interaction.get("interaction_type") or "").strip().upper()
        )
        if interaction_type != "COMMENT":
            continue

        reasons.add(f"Comentaste obras de técnica {_technique_label(work.technique)}")
        reasons.add(f"Comentaste obras de era {_era_label(work.era)}")

    return reasons


def recommendation_reasons(
    work, interactions, preferences: dict | None, works_by_id: dict
) -> list[str]:
    """Combina y deduplica las razones que explican una recomendación."""
    reasons = interaction_reasons(work, interactions, works_by_id)
    reasons |= preference_reasons(work, preferences)
    return sorted(reasons)


def score_work(
    work, interactions, preferences, works_by_id: dict, now: datetime
) -> int:
    """Calcula el puntaje total de una obra."""
    return interaction_score(
        work, interactions, works_by_id, now
    ) + preference_score(work, preferences)


def get_recommended_works(request) -> work_pb2.RecommendationListResponse:
    """Devuelve las obras recomendadas consultando el perfil del usuario mediante gRPC."""
    user_id = request.user_id

    # 1. Cargar obras del dominio propio (grpc-works)
    works = [row_to_candidate(row) for row in fetch_all(WORKS_QUERY)]
    works_by_id = {w.id: w for w in works}

    # 2. Obtener preferencias e interacciones desde grpc-users vía gRPC
    preferences, interactions = _get_user_profile_via_grpc(user_id)

    now = datetime.now()

    ranked = sorted(
        works,
        key=lambda work: (
            -score_work(work, interactions, preferences, works_by_id, now),
            work.id,
        ),
    )
    selected = ranked[: max(0, request.limit)]
    random.shuffle(selected)

    return work_pb2.RecommendationListResponse(
        recommendations=[
            work_pb2.RecommendedWork(
                work=candidate_to_proto(work),
                reasons=recommendation_reasons(
                    work, interactions, preferences, works_by_id
                ),
            )
            for work in selected
        ]
    )