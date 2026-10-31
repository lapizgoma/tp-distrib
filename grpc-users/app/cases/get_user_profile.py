"""Consultas y mapeo del perfil de usuario a protobuf."""

import json
from datetime import datetime

from app.db import fetch_all, fetch_one
from app.generated import user_pb2

USER_QUERY = """
    SELECT
        id,
        email,
        COALESCE(first_name, '') AS first_name,
        COALESCE(last_name, '') AS last_name,
        role
    FROM users
    WHERE id = %s
"""

PREFERENCES_QUERY = """
    SELECT
        favorite_topics,
        favorite_techniques,
        favorite_eras
    FROM user_preferences
    WHERE user_id = %s
"""

# Modificado: ahora trae el detalle completo de las interacciones
INTERACTIONS_QUERY = """
    SELECT work_id, interaction_type, created_at
    FROM user_work_interactions
    WHERE user_id = %s
    ORDER BY created_at DESC
"""


class UserNotFoundError(LookupError):
    """Se lanza cuando el usuario solicitado no existe."""

    pass


def parse_json_list(value) -> list[str]:
    """Convierte un JSON de lista en una lista de strings.

    Devuelve una lista vacía si el valor no es un JSON de lista válido.
    """
    if value is None:
        return []

    if isinstance(value, (list, tuple, set)):
        return [str(item) for item in value if item is not None]

    if isinstance(value, bytes):
        value = value.decode("utf-8")

    text = str(value).strip()
    if not text:
        return []

    try:
        decoded = json.loads(text)
    except (TypeError, ValueError):
        return []

    if not isinstance(decoded, list):
        return []

    return [str(item) for item in decoded if item is not None]


def preferences_to_proto(row: dict | None) -> user_pb2.UserPreferences:
    """Convierte una fila de preferencias en el mensaje UserPreferences."""
    row = row or {}
    return user_pb2.UserPreferences(
        favorite_topics=parse_json_list(row.get("favorite_topics")),
        favorite_techniques=parse_json_list(row.get("favorite_techniques")),
        favorite_eras=parse_json_list(row.get("favorite_eras")),
    )


def interactions_to_proto(user_id: int) -> tuple[list[int], list[user_pb2.UserInteraction]]:
    """Devuelve los IDs únicos interaccionados y la lista detallada de interacciones."""
    rows = fetch_all(INTERACTIONS_QUERY, (user_id,))
    
    unique_work_ids = sorted(list({int(row["work_id"]) for row in rows}))
    
    detailed_interactions = []
    for row in rows:
        created_at_str = ""
        created_at = row.get("created_at")
        if isinstance(created_at, datetime):
            created_at_str = created_at.isoformat()
        elif created_at is not None:
            created_at_str = str(created_at)

        detailed_interactions.append(
            user_pb2.UserInteraction(
                work_id=int(row["work_id"]),
                interaction_type=str(row.get("interaction_type") or ""),
                created_at=created_at_str,
            )
        )

    return unique_work_ids, detailed_interactions


def get_user_profile(request) -> user_pb2.UserProfileResponse:
    """Arma la respuesta del perfil con datos, preferencias e interacciones."""
    user = fetch_one(USER_QUERY, (request.user_id,))
    if user is None:
        raise UserNotFoundError(f"user {request.user_id} not found")

    preferences = fetch_one(PREFERENCES_QUERY, (request.user_id,))
    work_ids, detailed_interactions = interactions_to_proto(request.user_id)

    return user_pb2.UserProfileResponse(
        user_id=int(user["id"]),
        email=user.get("email") or "",
        first_name=user.get("first_name") or "",
        last_name=user.get("last_name") or "",
        role=user.get("role") or "",
        preferences=preferences_to_proto(preferences),
        interacted_work_ids=work_ids,
        interactions=detailed_interactions,  # Interacciones completas para gRPC
    )