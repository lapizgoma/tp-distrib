import unittest
from unittest.mock import patch

from app.cases.search_works_for_tour import (
    candidate_to_proto,
    row_to_candidate,
    search_works_for_tour,
)
from app.generated import work_pb2


def make_candidate(**overrides):
    row = {
        "id": 1,
        "title": "Work",
        "artist_id": 1,
        "artist_name": "Artist",
        "image_url": "",
        "creation_year": 1900,
        "technique": "OLEO",
        "dimensions": "",
        "era": "IMPRESIONISMO",
        "topics": "Nature",
        "description": "",
        "location": "SALA_2_IMPRESIONISMO",
        "availability": "EN_EXHIBICION",
        "estimated_duration_minutes": 10,
    }
    row.update(overrides)
    return row_to_candidate(row)


class SearchWorksForTourMappingTest(unittest.TestCase):
    def test_maps_database_row_to_candidate(self):
        row = {
            "id": 7,
            "title": "La última cena",
            "artist_id": 3,
            "artist_name": "Leonardo da Vinci",
            "image_url": "https://example.test/work.jpg",
            "creation_year": 1498,
            "technique": "TEMPLE",
            "dimensions": "460 x 880 cm",
            "era": "RENACIMIENTO",
            "topics": "Religion, History",
            "description": "Mural",
            "location": "SALA_1_GRANDES_MAESTROS",
            "availability": "EN_EXHIBICION",
            "estimated_duration_minutes": 15,
        }

        work = row_to_candidate(row)

        self.assertEqual(work.id, 7)
        self.assertEqual(work.topic, "Religion, History")
        self.assertEqual(work.topics, ("religion", "history"))
        self.assertEqual(work.estimated_duration_minutes, 15)

    def test_maps_candidate_to_proto(self):
        row = {
            "id": 1,
            "title": "La noche estrellada",
            "artist_id": 1,
            "artist_name": "Vincent van Gogh",
            "image_url": "https://example.test/night.jpg",
            "creation_year": 1889,
            "technique": "OLEO",
            "dimensions": "73,7 x 92,1 cm",
            "era": "IMPRESIONISMO",
            "topics": "Nature",
            "description": "Night view",
            "location": "SALA_4_ARTE_MODERNO",
            "availability": "EN_EXHIBICION",
            "estimated_duration_minutes": 12,
        }

        proto = candidate_to_proto(row_to_candidate(row))

        self.assertEqual(proto.id, 1)
        self.assertEqual(proto.artist_name, "Vincent van Gogh")
        self.assertEqual(proto.topic, "Nature")
        self.assertEqual(list(proto.topics), ["nature"])
        self.assertEqual(proto.estimated_duration_minutes, 12)

    def test_case_applies_request_criteria(self):
        candidates = [
            row_to_candidate(
                {
                    "id": 1,
                    "title": "Matching work",
                    "artist_id": 1,
                    "artist_name": "Artist",
                    "image_url": "",
                    "creation_year": 1889,
                    "technique": "OLEO",
                    "dimensions": "",
                    "era": "IMPRESIONISMO",
                    "topics": "Nature",
                    "description": "",
                    "location": "SALA_2_IMPRESIONISMO",
                    "availability": "EN_EXHIBICION",
                    "estimated_duration_minutes": 10,
                }
            ),
            row_to_candidate(
                {
                    "id": 2,
                    "title": "Non matching work",
                    "artist_id": 2,
                    "artist_name": "Artist",
                    "image_url": "",
                    "creation_year": 1503,
                    "technique": "TEMPLE",
                    "dimensions": "",
                    "era": "RENACIMIENTO",
                    "topics": "Religion",
                    "description": "",
                    "location": "SALA_1_GRANDES_MAESTROS",
                    "availability": "EN_EXHIBICION",
                    "estimated_duration_minutes": 10,
                }
            ),
        ]
        request = work_pb2.TourCriteriaRequest(
            topics=["Nature"],
            eras=["Impresionismo"],
            techniques=["óleo"],
            max_duration_minutes=30,
            max_works_count=5,
        )

        with patch(
            "app.cases.search_works_for_tour.fetch_work_candidates",
            return_value=candidates,
        ):
            response = search_works_for_tour(request)

        self.assertEqual([work.id for work in response.works], [1])
        self.assertEqual(response.total_duration_minutes, 10)
        self.assertEqual(list(response.rooms), ["sala_2_impresionismo"])
        self.assertEqual(list(response.notes), [])

    def test_case_applies_preferred_fields(self):
        candidates = [
            make_candidate(id=1, topic="Nature"),
            make_candidate(id=2, topics="Mythology", technique="TEMPLE", era="RENACIMIENTO"),
        ]
        request = work_pb2.TourCriteriaRequest(
            max_works_count=1,
            preferred_topics=["Mythology"],
        )

        with patch(
            "app.cases.search_works_for_tour.fetch_work_candidates",
            return_value=candidates,
        ):
            response = search_works_for_tour(request)

        self.assertEqual([work.id for work in response.works], [2])

    def test_case_returns_plan_metadata(self):
        candidates = [
            make_candidate(id=1, location="SALA_4_ARTE_MODERNO", creation_year=1889),
            make_candidate(id=2, location="SALA_2_IMPRESIONISMO", creation_year=1872),
        ]
        request = work_pb2.TourCriteriaRequest()

        with patch(
            "app.cases.search_works_for_tour.fetch_work_candidates",
            return_value=candidates,
        ):
            response = search_works_for_tour(request)

        self.assertEqual([work.id for work in response.works], [2, 1])
        self.assertEqual(response.total_duration_minutes, 25)
        self.assertEqual(
            list(response.rooms),
            ["sala_2_impresionismo", "sala_4_arte_moderno"],
        )
        self.assertEqual(list(response.notes), [])

    def test_case_relaxes_technique_when_there_are_no_matches(self):
        request = work_pb2.TourCriteriaRequest(
            topics=["Nature"],
            eras=["Impresionismo"],
            techniques=["Temple"],
        )

        with patch(
            "app.cases.search_works_for_tour.fetch_work_candidates",
            return_value=[make_candidate()],
        ):
            response = search_works_for_tour(request)

        self.assertEqual([work.id for work in response.works], [1])
        self.assertTrue(any("técnicas" in note for note in response.notes))

    def test_case_relaxes_era_after_technique(self):
        request = work_pb2.TourCriteriaRequest(
            topics=["Nature"],
            eras=["Renacimiento"],
            techniques=["Temple"],
        )

        with patch(
            "app.cases.search_works_for_tour.fetch_work_candidates",
            return_value=[make_candidate()],
        ):
            response = search_works_for_tour(request)

        self.assertEqual([work.id for work in response.works], [1])
        self.assertTrue(any("técnicas ni la era" in note for note in response.notes))

    def test_case_returns_empty_tour_with_topic_note(self):
        request = work_pb2.TourCriteriaRequest(topics=["Mythology"])

        with patch(
            "app.cases.search_works_for_tour.fetch_work_candidates",
            return_value=[make_candidate()],
        ):
            response = search_works_for_tour(request)

        self.assertEqual(len(response.works), 0)
        self.assertEqual(response.total_duration_minutes, 0)
        self.assertEqual(list(response.rooms), [])
        self.assertTrue(any("temas" in note for note in response.notes))


if __name__ == "__main__":
    unittest.main()
