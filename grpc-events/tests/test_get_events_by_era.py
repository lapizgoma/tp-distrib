import unittest
from unittest.mock import patch

from app.cases.event_helpers import filter_rows_by_era
from app.cases.get_events_by_era import get_events_by_era
from app.generated import event_pb2
from app.normalization import canonical_era, canonical_location


class EventsByEraTest(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"id": 1, "associated_era": "RENACIMIENTO"},
            {"id": 2, "associated_era": "IMPRESIONISMO"},
            {"id": 3, "associated_era": "CONTEMPORANEO"},
            {"id": 4, "associated_era": ""},
        ]

    def test_filters_by_era_code(self):
        result = filter_rows_by_era(self.rows, "IMPRESIONISMO")

        self.assertEqual([row["id"] for row in result], [2])

    def test_filters_by_era_alias_with_accent(self):
        result = filter_rows_by_era(self.rows, "Arte Contemporáneo")

        self.assertEqual([row["id"] for row in result], [3])

    def test_empty_era_returns_empty(self):
        self.assertEqual(filter_rows_by_era(self.rows, ""), [])

    def test_normalizes_locations(self):
        self.assertEqual(canonical_era("Impresionismo"), "impresionismo")
        self.assertEqual(canonical_location("Sala 4 Arte Moderno"), "sala_4_arte_moderno")

    def test_case_returns_matching_events(self):
        rows = [
            {
                "id": 1,
                "title": "Event",
                "description": "",
                "datetime": "2026-11-01T18:30:00",
                "duration": 60,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            }
        ]
        request = event_pb2.EventsByEraRequest(era="Impresionismo")

        with patch(
            "app.cases.get_events_by_era.fetch_event_rows",
            return_value=rows,
        ):
            response = get_events_by_era(request)

        self.assertEqual([event.id for event in response.events], [1])


if __name__ == "__main__":
    unittest.main()
