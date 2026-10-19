"""Punto de entrada del servicio gRPC de usuarios."""

import logging
import os
from concurrent import futures

import grpc
import mysql.connector

from app.cases.get_user_profile import UserNotFoundError, get_user_profile
from app.config import load_env
from app.generated import user_pb2_grpc


class UserServiceServicer(user_pb2_grpc.UserServiceServicer):
    """Implementación gRPC del perfil de usuario."""

    def GetUserProfile(self, request, context):
        """Devuelve el perfil, preferencias e interacciones del usuario."""
        try:
            return get_user_profile(request)
        except UserNotFoundError:
            context.abort(grpc.StatusCode.NOT_FOUND, "user not found")
        except mysql.connector.Error:
            logging.exception("GetUserProfile database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("GetUserProfile unexpected error")
            context.abort(grpc.StatusCode.INTERNAL, "internal error")


def _env_int(name: str, default: int) -> int:
    """Devuelve una variable de entorno como entero o el valor por defecto."""
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return int(value)


def serve() -> None:
    """Inicia el servidor gRPC y espera hasta que se detenga."""
    load_env()
    port = os.getenv("GRPC_PORT", "50053")
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=_env_int("GRPC_MAX_WORKERS", 10)),
    )
    user_pb2_grpc.add_UserServiceServicer_to_server(UserServiceServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logging.info("grpc-users listening on port %s", port)
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        server.stop(grace=5).wait()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve()
