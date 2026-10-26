"""Punto de entrada del servicio gRPC de obras."""

import logging
import os
from concurrent import futures

import grpc
import mysql.connector

from app.cases.search_works_for_tour import search_works_for_tour
from app.cases.get_recommended_works import get_recommended_works
from app.cases.get_works_and_artists_by_era import get_works_and_artists_by_era
from app.config import load_env
from app.generated import work_pb2_grpc


from app.cases.get_works_for_comparison import (
    InvalidComparisonRequest,
    WorksNotFound,
    get_works_for_comparison,
)


class WorkServiceServicer(work_pb2_grpc.WorkServiceServicer):
    """Implementación gRPC del servicio de obras."""

    def SearchWorksForTour(self, request, context):
        """Devuelve las obras que forman el tour según los criterios recibidos."""
        try:
            return search_works_for_tour(request)
        except mysql.connector.Error:
            logging.exception("SearchWorksForTour database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("SearchWorksForTour unexpected error")
            context.abort(grpc.StatusCode.INTERNAL, "internal error")

    def GetWorksAndArtistsByEra(self, request, context):
        """Devuelve las obras y artistas según la era/movimiento artístico solicitado."""
        try:
            return get_works_and_artists_by_era(request)
        except mysql.connector.Error:
            logging.exception("GetWorksAndArtistsByEra database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("GetWorksAndArtistsByEra unexpected error")
            context.abort(grpc.StatusCode.INTERNAL, "internal error")

    def GetRecommendedWorks(self, request, context):
        """Devuelve obras recomendadas según preferencias e interacciones."""
        try:
            return get_recommended_works(request)
        except mysql.connector.Error:
            logging.exception("GetRecommendedWorks database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("GetRecommendedWorks unexpected error")
            context.abort(grpc.StatusCode.INTERNAL, "internal error")

    def GetWorksForComparison(self, request, context):
        """Devuelve las obras a comparar, en el orden pedido."""
        try:
            return get_works_for_comparison(request)
        except InvalidComparisonRequest as error:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(error))
        except WorksNotFound as error:
            context.abort(grpc.StatusCode.NOT_FOUND, str(error))
        except mysql.connector.Error:
            logging.exception("GetWorksForComparison database error")
            context.abort(grpc.StatusCode.INTERNAL, "database error")
        except Exception:
            logging.exception("GetWorksForComparison unexpected error")
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
    port = os.getenv("GRPC_PORT", "50051")
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=_env_int("GRPC_MAX_WORKERS", 10)),
    )
    work_pb2_grpc.add_WorkServiceServicer_to_server(WorkServiceServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logging.info("grpc-works listening on port %s", port)
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        server.stop(grace=5).wait()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve()
