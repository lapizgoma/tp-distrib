import unittest
from datetime import datetime
from unittest.mock import patch

from app.cases.event_helpers import (
    filter_rows_by_locations,
    format_datetime,
    row_to_event,
)
from app.cases.get_events_by_locations import get_events_by_locations
from app.generated import event_pb2


class EventsByLocationsTest(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {
                "id": 1,
                "title": "Visita guiada",
                "description": "Grandes maestros",
                "datetime": datetime(2026, 11, 1, 18, 30),
                "duration": 60,
                "location": "SALA_1_GRANDES_MAESTROS",
                "event_type": "VISITA_GUIADA",
                "associated_era": "RENACIMIENTO",
            },
            {
                "id": 2,
                "title": "Exposición impresionista",
                "description": "Luz y color",
                "datetime": datetime(2026, 11, 2, 10, 0),
                "duration": 180,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
        ]

    def test_filters_by_location_code(self):
        result = filter_rows_by_locations(self.rows, ["SALA_2_IMPRESIONISMO"])

        self.assertEqual([row["id"] for row in result], [2])

    def test_filters_by_location_alias(self):
        result = filter_rows_by_locations(self.rows, ["Sala 1 Grandes Maestros"])

        self.assertEqual([row["id"] for row in result], [1])

    def test_empty_locations_returns_empty(self):
        self.assertEqual(filter_rows_by_locations(self.rows, []), [])

    def test_formats_datetime(self):
        self.assertEqual(format_datetime(datetime(2026, 11, 1, 18, 30)), "2026-11-01T18:30:00")
        self.assertEqual(format_datetime("2026-11-01 18:30:00"), "2026-11-01T18:30:00")
        self.assertEqual(format_datetime(None), "")

    def test_maps_row_to_event_proto(self):
        event = row_to_event(self.rows[0])

        self.assertEqual(event.id, 1)
        self.assertEqual(event.datetime, "2026-11-01T18:30:00")
        self.assertEqual(event.location, "SALA_1_GRANDES_MAESTROS")
        self.assertEqual(event.associated_era, "RENACIMIENTO")

    def test_case_returns_matching_events(self):
        request = event_pb2.EventsByLocationsRequest(
            locations=["Sala 2 Impresionismo"],
        )

        with patch(
            "app.cases.get_events_by_locations.fetch_event_rows",
            return_value=self.rows,
        ):
            response = get_events_by_locations(request)

        self.assertEqual([event.id for event in response.events], [2])


if __name__ == "__main__":
    unittest.main()
