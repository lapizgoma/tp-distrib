"""Pool de conexiones MySQL y helpers de consulta para grpc-events."""

import os

from mysql.connector import pooling

from app.config import load_env

load_env()

_pool = None


def _env_int(name: str, default: int) -> int:
    """Devuelve una variable de entorno como entero o el valor por defecto."""
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return int(value)


def _pool_config() -> dict:
    """Construye la configuración del pool a partir del entorno."""
    return {
        "pool_name": "grpc_events_pool",
        "pool_size": _env_int("DB_POOL_SIZE", 5),
        "pool_reset_session": True,
        "host": os.getenv("DB_HOST", "localhost"),
        "port": _env_int("DB_PORT", 3306),
        "database": os.getenv("DB_NAME", "museo_virtual"),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", "root"),
        "charset": "utf8mb4",
        "collation": "utf8mb4_0900_ai_ci",
        "autocommit": True,
    }


def get_pool() -> pooling.MySQLConnectionPool:
    """Devuelve el pool compartido, creándolo en el primer uso."""
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(**_pool_config())
    return _pool


def get_connection():
    """Obtiene una conexión del pool."""
    return get_pool().get_connection()


def fetch_all(sql: str, params=None) -> list[dict]:
    """Ejecuta una consulta y devuelve todas las filas como diccionarios."""
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        return list(cursor.fetchall())
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


def fetch_one(sql: str, params=None) -> dict | None:
    """Ejecuta una consulta y devuelve la primera fila como diccionario."""
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        return cursor.fetchone()
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()
