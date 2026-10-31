"""Caso de uso para registrar una interacción (VIEW/COMMENT) del usuario con una obra."""

from app.db import fetch_one
# Si en tu db.py tenés helper para ejecutar sentencias de escritura:
from app.db import get_connection
from app.generated import user_pb2

INSERT_INTERACTION_QUERY = """
    INSERT INTO user_work_interactions (user_id, work_id, interaction_type, created_at)
    VALUES (%s, %s, %s, NOW())
"""

def register_interaction(request) -> user_pb2.RegisterInteractionResponse:
    """Inserta la interacción en la base de datos y devuelve éxito."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                INSERT_INTERACTION_QUERY,
                (request.user_id, request.work_id, request.interaction_type)
            )
        conn.commit()
    finally:
        conn.close()
        
    return user_pb2.RegisterInteractionResponse(success=True)