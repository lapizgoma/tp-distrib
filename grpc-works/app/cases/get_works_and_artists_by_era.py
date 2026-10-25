"""Caso de uso: Obtener obras y artistas asociados según una era/movimiento artístico."""

from app.db import fetch_all
from app.generated import work_pb2


def get_works_and_artists_by_era(request: work_pb2.ExplorationByEraRequest) -> work_pb2.ExplorationWorksResponse:
    """Consulta la base de datos y devuelve las obras y los nombres de los artistas pertenecientes a una era."""
    era = request.era

    sql_works = """
        SELECT 
            w.id,
            w.title,
            w.artist_id,
            a.name AS artist_name,
            w.image_url,
            w.creation_year,
            w.technique,
            w.dimensions,
            w.era,
            w.topics,
            w.description,
            w.location,
            w.availability,
            w.estimated_duration_minutes
        FROM works w
        LEFT JOIN artists a ON w.artist_id = a.id
        WHERE LOWER(w.era) = LOWER(%s)
    """
    rows = fetch_all(sql_works, (era,))

    works_list = []
    artists_set = set()

    for row in rows:
        artist_name = row.get("artist_name") or ""
        if artist_name:
            artists_set.add(artist_name)

        raw_topics = row.get("topics") or ""

        work_msg = work_pb2.Work(
            id=int(row["id"]),
            title=row.get("title") or "",
            artist_id=int(row.get("artist_id") or 0),
            artist_name=artist_name,
            image_url=row.get("image_url") or "",
            creation_year=int(row.get("creation_year") or 0),
            technique=row.get("technique") or "",
            dimensions=row.get("dimensions") or "",
            era=row.get("era") or "",
            topic=raw_topics,
            description=row.get("description") or "",
            location=row.get("location") or "",
            availability=row.get("availability") or "",
            estimated_duration_minutes=int(row.get("estimated_duration_minutes") or 10),
        )
        works_list.append(work_msg)

    return work_pb2.ExplorationWorksResponse(
        era=era,
        works=works_list,
        associated_artists=list(artists_set),
    )