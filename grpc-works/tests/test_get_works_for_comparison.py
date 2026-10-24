"""Tests del caso de uso GetWorksForComparison (sin base de datos real)."""

import importlib

import grpc
import pytest

from app.generated import work_pb2
from app.server import WorkServiceServicer

case = importlib.import_module("app.cases.get_works_for_comparison")


def make_row(work_id: int, **overrides) -> dict:
    row = {
        "id": work_id,
        "title": f"Work {work_id}",
        "artist_id": 1,
        "artist_name": "Artist",
        "image_url": "http://img",
        "creation_year": 1900,
        "technique": "OLEO",
        "dimensions": "10 x 10 cm",
        "era": "IMPRESIONISMO",
        "topics": "Naturaleza,Paisaje",
        "description": "desc",
        "location": "SALA_1",
        "availability": "EN_EXHIBICION",
        "estimated_duration_minutes": 10,
    }
    row.update(overrides)
    return row


@pytest.fixture
def fake_db(monkeypatch):
    """Reemplaza fetch_all por una versión que devuelve filas fijas."""
    calls = []

    def install(rows):
        def fake_fetch_all(sql, params=None):
            calls.append((sql, params))
            return rows

        monkeypatch.setattr(case, "fetch_all", fake_fetch_all)
        return calls

    return install


def request(*ids):
    return work_pb2.CompareWorksRequest(work_ids=list(ids))


def test_returns_works_in_requested_order(fake_db):
    # La base las devuelve en otro orden que el pedido.
    fake_db([make_row(1), make_row(5), make_row(9)])

    response = case.get_works_for_comparison(request(9, 1, 5))

    assert [w.id for w in response.works] == [9, 1, 5]


def test_maps_all_fields(fake_db):
    fake_db(
        [
            make_row(1, title="A", artist_name="Monet", creation_year=1872),
            make_row(2),
        ]
    )

    work = case.get_works_for_comparison(request(1, 2)).works[0]

    assert work.title == "A"
    assert work.artist_name == "Monet"
    assert work.creation_year == 1872
    assert work.topic == "Naturaleza,Paisaje"
    assert work.availability == "EN_EXHIBICION"


def test_duplicate_ids_are_ignored(fake_db):
    calls = fake_db([make_row(1), make_row(2)])

    response = case.get_works_for_comparison(request(1, 1, 2))

    assert [w.id for w in response.works] == [1, 2]
    assert calls[0][1] == (1, 2)


def test_works_in_storage_can_be_compared(fake_db):
    calls = fake_db(
        [make_row(3, availability="EN_DEPOSITO"), make_row(7, availability="EN_DEPOSITO")]
    )

    response = case.get_works_for_comparison(request(3, 7))

    assert [w.availability for w in response.works] == ["EN_DEPOSITO", "EN_DEPOSITO"]
    assert "EN_EXHIBICION" not in calls[0][0]


def test_null_columns_use_defaults(fake_db):
    fake_db(
        [
            make_row(1, technique=None, era=None, topics=None, creation_year=None),
            make_row(2),
        ]
    )

    work = case.get_works_for_comparison(request(1, 2)).works[0]

    assert work.technique == ""
    assert work.era == ""
    assert work.topic == ""
    assert work.creation_year == 0


def test_unknown_ids_are_omitted_when_enough_works_remain(fake_db):
    fake_db([make_row(1), make_row(5)])

    response = case.get_works_for_comparison(request(1, 5, 999))

    assert [w.id for w in response.works] == [1, 5]


def test_too_few_ids_is_invalid_and_skips_the_database(fake_db):
    calls = fake_db([])

    with pytest.raises(case.InvalidComparisonRequest):
        case.get_works_for_comparison(request(1))
    with pytest.raises(case.InvalidComparisonRequest):
        case.get_works_for_comparison(request(4, 4))
    with pytest.raises(case.InvalidComparisonRequest):
        case.get_works_for_comparison(request())

    assert calls == []


def test_too_many_ids_is_invalid(fake_db):
    fake_db([])

    with pytest.raises(case.InvalidComparisonRequest):
        case.get_works_for_comparison(request(*range(1, case.MAX_WORKS + 2)))


def test_not_enough_existing_works_raises_not_found(fake_db):
    fake_db([make_row(1)])

    with pytest.raises(case.WorksNotFound) as error:
        case.get_works_for_comparison(request(1, 998, 999))

    assert "998" in str(error.value)


# ---- Mapeo a códigos gRPC en el servicer ----------------------------------


class AbortCalled(Exception):
    pass


class FakeContext:
    """Imita context.abort: guarda el código y corta el RPC con una excepción."""

    def abort(self, code, details):
        self.code = code
        self.details = details
        raise AbortCalled()


def test_servicer_maps_invalid_request_to_invalid_argument():
    context = FakeContext()

    with pytest.raises(AbortCalled):
        WorkServiceServicer().GetWorksForComparison(request(1), context)

    assert context.code == grpc.StatusCode.INVALID_ARGUMENT


def test_servicer_maps_missing_works_to_not_found(fake_db):
    fake_db([])
    context = FakeContext()

    with pytest.raises(AbortCalled):
        WorkServiceServicer().GetWorksForComparison(request(1, 2), context)

    assert context.code == grpc.StatusCode.NOT_FOUND


def test_servicer_returns_works_on_success(fake_db):
    fake_db([make_row(1), make_row(2)])

    response = WorkServiceServicer().GetWorksForComparison(request(1, 2), FakeContext())

    assert [w.id for w in response.works] == [1, 2]