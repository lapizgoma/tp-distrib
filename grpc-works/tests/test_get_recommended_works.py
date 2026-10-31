"""Tests del caso de uso GetRecommendedWorks (sin base de datos real)."""

import importlib
from datetime import datetime, timedelta

import grpc
import mysql.connector
import pytest

from app.generated import work_pb2
from app.server import WorkServiceServicer

case = importlib.import_module("app.cases.get_recommended_works")

NOW = datetime(2026, 10, 25, 12, 0, 0)


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


def make_interaction(work_id: int, interaction_type: str, **overrides) -> dict:
    interaction = {
        "work_id": work_id,
        "interaction_type": interaction_type,
        "created_at": NOW - timedelta(days=30),
    }
    interaction.update(overrides)
    return interaction


@pytest.fixture
def fake_db(monkeypatch):
    """Reemplaza la consulta de obras y la llamada gRPC por datos simulados."""
    state = {"works": [], "interactions": [], "preferences": None}

    def install(works=(), interactions=(), preferences=None):
        state["works"] = list(works)
        state["interactions"] = list(interactions)
        state["preferences"] = preferences

        def fake_fetch_all(sql, params=None):
            return state["works"]

        def fake_get_user_profile_via_grpc(user_id: int):
            return state["preferences"], state["interactions"]

        monkeypatch.setattr(case, "fetch_all", fake_fetch_all)
        monkeypatch.setattr(case, "_get_user_profile_via_grpc", fake_get_user_profile_via_grpc)
        return state

    return install


def request(user_id=1, limit=10):
    return work_pb2.RecommendationCriteriaRequest(user_id=user_id, limit=limit)


def reasons_of(response, index=0):
    return list(response.recommendations[index].reasons)


# ---- Razones ---------------------------------------------------------------


def test_preference_reasons_are_humanized():
    work = case.row_to_candidate(make_row(1, topics="Bodegón,Flores"))
    preferences = {
        "favorite_topics": '["Bodegón"]',
        "favorite_techniques": '["Óleo"]',
        "favorite_eras": '["Impresionismo"]',
    }
    works_by_id = {1: work}

    assert case.recommendation_reasons(work, [], preferences, works_by_id) == [
        "Coincide con tu era favorita: Impresionismo",
        "Coincide con tu interés en Bodegón",
        "Coincide con tu técnica favorita: Óleo",
    ]


def test_comment_reasons_are_split_by_technique_and_era():
    work = case.row_to_candidate(make_row(1))
    work2 = case.row_to_candidate(make_row(2))
    interactions = [make_interaction(2, "COMMENT")]
    works_by_id = {1: work, 2: work2}

    assert case.recommendation_reasons(work, interactions, None, works_by_id) == [
        "Comentaste obras de era Impresionismo",
        "Comentaste obras de técnica Óleo",
    ]


def test_comment_reasons_are_deduplicated():
    work = case.row_to_candidate(make_row(1))
    work2 = case.row_to_candidate(make_row(2))
    work3 = case.row_to_candidate(make_row(3))
    interactions = [
        make_interaction(2, "COMMENT"),
        make_interaction(3, "COMMENT"),
    ]
    works_by_id = {1: work, 2: work2, 3: work3}

    assert case.recommendation_reasons(work, interactions, None, works_by_id) == [
        "Comentaste obras de era Impresionismo",
        "Comentaste obras de técnica Óleo",
    ]


def test_views_do_not_add_reasons():
    work = case.row_to_candidate(make_row(1))
    work2 = case.row_to_candidate(make_row(2))
    interactions = [make_interaction(2, "VIEW")]
    works_by_id = {1: work, 2: work2}

    assert case.recommendation_reasons(work, interactions, None, works_by_id) == []


def test_zero_score_has_no_reasons(fake_db):
    fake_db(works=[make_row(1)])

    assert reasons_of(case.get_recommended_works(request(limit=1))) == []


# ---- Selección y respuesta -------------------------------------------------


def test_returns_only_top_limit_works(fake_db):
    fake_db(
        works=[make_row(1), make_row(2), make_row(3)],
        interactions=[make_interaction(2, "COMMENT")],
        preferences={"favorite_topics": '["Naturaleza"]'},
    )

    response = case.get_recommended_works(request(limit=2))

    assert len(response.recommendations) == 2


def test_response_uses_random_order(fake_db, monkeypatch):
    fake_db(works=[make_row(1), make_row(2), make_row(3)])

    def reverse(works):
        works.reverse()

    monkeypatch.setattr(case.random, "shuffle", reverse)

    response = case.get_recommended_works(request(limit=3))

    assert [item.work.id for item in response.recommendations] == [3, 2, 1]


def test_limit_zero_returns_empty(fake_db):
    fake_db(works=[make_row(1)])

    assert list(case.get_recommended_works(request(limit=0)).recommendations) == []


def test_maps_work_fields(fake_db):
    fake_db(works=[make_row(1, title="A", artist_name="Monet")])

    work = case.get_recommended_works(request()).recommendations[0].work

    assert work.title == "A"
    assert work.artist_name == "Monet"
    assert list(work.topics) == ["naturaleza", "paisaje"]


def test_reasons_travel_with_their_work(fake_db, monkeypatch):
    fake_db(
        works=[make_row(1), make_row(2, technique="TEMPLE", era="BARROCO")],
        interactions=[make_interaction(1, "COMMENT")],
    )

    def sensitive_shuffle(works):
        works.reverse()

    monkeypatch.setattr(case.random, "shuffle", sensitive_shuffle)

    response = case.get_recommended_works(request(limit=2))

    reasons_by_id = {
        item.work.id: list(item.reasons) for item in response.recommendations
    }
    assert reasons_by_id[1] == [
        "Comentaste obras de era Impresionismo",
        "Comentaste obras de técnica Óleo",
    ]
    assert reasons_by_id[2] == []


# ---- Mapeo a códigos gRPC en el servicer ----------------------------------


class AbortCalled(Exception):
    pass


class FakeContext:
    def abort(self, code, details):
        self.code = code
        self.details = details
        raise AbortCalled()


def test_servicer_returns_works_on_success(fake_db):
    fake_db(works=[make_row(1)])

    response = WorkServiceServicer().GetRecommendedWorks(request(), FakeContext())

    assert [item.work.id for item in response.recommendations] == [1]


def test_servicer_maps_database_error_to_internal(fake_db, monkeypatch):
    fake_db(works=[])

    def fail(sql, params=None):
        raise mysql.connector.Error("boom")

    monkeypatch.setattr(case, "fetch_all", fail)
    context = FakeContext()

    with pytest.raises(AbortCalled):
        WorkServiceServicer().GetRecommendedWorks(request(), context)

    assert context.code == grpc.StatusCode.INTERNAL