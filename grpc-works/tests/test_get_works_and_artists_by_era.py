"""Tests del caso de uso GetWorksAndArtistsByEra para el Requerimiento 4."""

from unittest.mock import patch
from app.cases.get_works_and_artists_by_era import get_works_and_artists_by_era
from app.generated import work_pb2


def make_row(work_id: int, **overrides) -> dict:
    """Helper para construir filas simuladas de la base de datos."""
    row = {
        "id": work_id,
        "title": f"Obra {work_id}",
        "artist_id": 10,
        "artist_name": "Claude Monet",
        "image_url": "http://example.com/image.jpg",
        "creation_year": 1872,
        "technique": "Óleo sobre lienzo",
        "dimensions": "48 cm x 63 cm",
        "era": "IMPRESIONISMO",
        "topics": "Paisaje, Marino",
        "description": "Obra de prueba",
        "location": "SALA_1",
        "availability": "EN_EXHIBICION",
        "estimated_duration_minutes": 15,
    }
    row.update(overrides)
    return row


@patch("app.cases.get_works_and_artists_by_era.fetch_all")
def test_get_works_and_artists_by_era_success(mock_fetch_all):
    # Caso 1: Obtención exitosa de obras y artistas asociados ordenados/deduplicados
    mock_rows = [
        make_row(1, title="Impression, Sunrise", artist_name="Claude Monet"),
        make_row(2, title="Water Lilies", artist_name="Claude Monet"),
        make_row(3, title="The Floor Scrapers", artist_name="Gustave Caillebotte"),
    ]
    mock_fetch_all.return_value = mock_rows

    request = work_pb2.ExplorationByEraRequest(era="IMPRESIONISMO")
    response = get_works_and_artists_by_era(request)

    assert response.era == "IMPRESIONISMO"
    assert len(response.works) == 3
    assert response.works[0].title == "Impression, Sunrise"
    assert response.works[0].artist_name == "Claude Monet"
    # Verifica que los artistas asociados estén deduplicados
    assert sorted(response.associated_artists) == ["Claude Monet", "Gustave Caillebotte"]
    mock_fetch_all.assert_called_once()


@patch("app.cases.get_works_and_artists_by_era.fetch_all")
def test_get_works_and_artists_by_era_empty(mock_fetch_all):
    # Caso 2: Manejo de era sin resultados (respuesta vacía sin errores)
    mock_fetch_all.return_value = []

    request = work_pb2.ExplorationByEraRequest(era="ERA_INEXISTENTE")
    response = get_works_and_artists_by_era(request)

    assert response.era == "ERA_INEXISTENTE"
    assert len(response.works) == 0
    assert len(response.associated_artists) == 0


@patch("app.cases.get_works_and_artists_by_era.fetch_all")
def test_get_works_and_artists_by_era_case_insensitive(mock_fetch_all):
    # Caso 3: Búsqueda insensible a mayúsculas/minúsculas (case-insensitive)
    mock_rows = [make_row(1, title="Impression", era="IMPRESIONISMO")]
    mock_fetch_all.return_value = mock_rows

    request = work_pb2.ExplorationByEraRequest(era="impresionismo")
    response = get_works_and_artists_by_era(request)

    assert response.era == "impresionismo"
    assert len(response.works) == 1
    mock_fetch_all.assert_called_once()


@patch("app.cases.get_works_and_artists_by_era.fetch_all")
def test_get_works_and_artists_by_era_ignores_empty_artist_names(mock_fetch_all):
    # Caso 4: Filtrado de nombres de artistas vacíos o no definidos
    mock_rows = [
        make_row(1, artist_name=""),
        make_row(2, artist_name="Edgar Degas"),
    ]
    mock_fetch_all.return_value = mock_rows

    request = work_pb2.ExplorationByEraRequest(era="IMPRESIONISMO")
    response = get_works_and_artists_by_era(request)

    assert len(response.works) == 2
    assert response.associated_artists == ["Edgar Degas"]


@patch("app.cases.get_works_and_artists_by_era.fetch_all")
def test_get_works_and_artists_by_era_multiple_artists_deduplicated(mock_fetch_all):
    # Caso 5: Verifica que al haber múltiples obras con artistas repetidos, se dedupliquen correctamente
    mock_rows = [
        make_row(1, artist_name="Claude Monet"),
        make_row(2, artist_name="Claude Monet"),
        make_row(3, artist_name="Pierre-Auguste Renoir"),
        make_row(4, artist_name="Pierre-Auguste Renoir"),
    ]
    mock_fetch_all.return_value = mock_rows

    request = work_pb2.ExplorationByEraRequest(era="IMPRESIONISMO")
    response = get_works_and_artists_by_era(request)

    assert len(response.works) == 4
    assert len(response.associated_artists) == 2
    assert sorted(response.associated_artists) == ["Claude Monet", "Pierre-Auguste Renoir"]


@patch("app.cases.get_works_and_artists_by_era.fetch_all")
def test_get_works_and_artists_by_era_preserves_work_fields(mock_fetch_all):
    # Caso 6: Verifica el mapeo completo de todos los campos de la obra hacia el mensaje Protobuf
    mock_rows = [
        make_row(
            100,
            title="Noche Estrellada",
            artist_id=5,
            artist_name="Vincent van Gogh",
            creation_year=1889,
            technique="Óleo",
            dimensions="73 x 92 cm",
            era="POSTIMPRESIONISMO",
            topics="Noche, Cielo",
            description="Obra maestra",
            location="SALA_3",
            availability="EN_EXHIBICION",
            estimated_duration_minutes=20,
        )
    ]
    mock_fetch_all.return_value = mock_rows

    request = work_pb2.ExplorationByEraRequest(era="POSTIMPRESIONISMO")
    response = get_works_and_artists_by_era(request)

    work = response.works[0]
    assert work.id == 100
    assert work.title == "Noche Estrellada"
    assert work.artist_id == 5
    assert work.artist_name == "Vincent van Gogh"
    assert work.creation_year == 1889
    assert work.technique == "Óleo"
    assert work.dimensions == "73 x 92 cm"
    assert work.era == "POSTIMPRESIONISMO"
    assert work.topic == "Noche, Cielo"
    assert work.description == "Obra maestra"
    assert work.location == "SALA_3"
    assert work.availability == "EN_EXHIBICION"
    assert work.estimated_duration_minutes == 20