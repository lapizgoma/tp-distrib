"""Punto de entrada del servicio gRPC de eventos."""

import logging
import os
from concurrent import futures

import grpc
import mysql.connector

from app.cases.get_events_by_era import get_events_by_era
from app.cases.get_events_by_locations import get_events_by_locations
from app.config import load_env
from app.generated import event_pb2_grpc


class EventServiceServicer(event_pb2_grpc.EventServiceServicer):
    """Implementación gRPC de las consultas de eventos."""

    def GetEventsByLocations(self, request, context):
        """Devuelve los eventos ubicados en las salas pedidas."""
        try:
            return get_events_by_locations(request)
        except mysql.connector.Error:
            logging.exception("GetEventsByLocations database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("GetEventsByLocations unexpected error")
            context.abort(grpc.StatusCode.INTERNAL, "internal error")

    def GetEventsByEra(self, request, context):
        """Devuelve los eventos asociados a una era."""
        try:
            return get_events_by_era(request)
        except mysql.connector.Error:
            logging.exception("GetEventsByEra database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("GetEventsByEra unexpected error")
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
    port = os.getenv("GRPC_PORT", "50052")
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=_env_int("GRPC_MAX_WORKERS", 10)),
    )
    event_pb2_grpc.add_EventServiceServicer_to_server(EventServiceServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logging.info("grpc-events listening on port %s", port)
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        server.stop(grace=5).wait()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve()
