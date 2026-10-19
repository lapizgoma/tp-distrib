"""Consultas y mapeo del perfil de usuario a protobuf."""

import json

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

INTERACTIONS_QUERY = """
    SELECT DISTINCT work_id
    FROM user_work_interactions
    WHERE user_id = %s
    ORDER BY work_id
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


def interacted_work_ids(user_id: int) -> list[int]:
    """Devuelve los ids de obras con interacción del usuario."""
    rows = fetch_all(INTERACTIONS_QUERY, (user_id,))
    return [int(row["work_id"]) for row in rows]


def get_user_profile(request) -> user_pb2.UserProfileResponse:
    """Arma la respuesta del perfil con datos, preferencias e interacciones."""
    user = fetch_one(USER_QUERY, (request.user_id,))
    if user is None:
        raise UserNotFoundError(f"user {request.user_id} not found")

    preferences = fetch_one(PREFERENCES_QUERY, (request.user_id,))

    return user_pb2.UserProfileResponse(
        user_id=int(user["id"]),
        email=user.get("email") or "",
        first_name=user.get("first_name") or "",
        last_name=user.get("last_name") or "",
        role=user.get("role") or "",
        preferences=preferences_to_proto(preferences),
        interacted_work_ids=interacted_work_ids(request.user_id),
    )
