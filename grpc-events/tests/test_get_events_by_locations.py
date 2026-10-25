import unittest
from datetime import datetime
from unittest.mock import patch

from app.cases.event_helpers import (
    filter_rows_by_future,
    filter_rows_by_locations,
    filter_rows_by_window,
    format_datetime,
    parse_datetime,
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

    def test_parses_datetime_values(self):
        expected = datetime(2026, 11, 1, 18, 30)

        self.assertEqual(parse_datetime(expected), expected)
        self.assertEqual(parse_datetime("2026-11-01T18:30:00"), expected)
        self.assertEqual(parse_datetime("2026-11-01 18:30:00"), expected)
        self.assertIsNone(parse_datetime(None))
        self.assertIsNone(parse_datetime("not-a-date"))

    def test_filters_only_future_events(self):
        rows = [
            {"id": 1, "datetime": datetime(2026, 10, 1, 10, 0)},
            {"id": 2, "datetime": "2026-10-24T10:00:00"},
            {"id": 3, "datetime": "2026-10-25 10:00:00"},
            {"id": 4, "datetime": None},
            {"id": 5, "datetime": "not-a-date"},
        ]

        result = filter_rows_by_future(rows, now=datetime(2026, 10, 24, 12, 0))

        self.assertEqual([row["id"] for row in result], [3])

    def test_filters_events_overlapping_window(self):
        rows = [
            {
                "id": 1,
                "datetime": datetime(2026, 11, 1, 9, 0),
                "duration": 60,
            },
            {
                "id": 2,
                "datetime": datetime(2026, 11, 1, 10, 15),
                "duration": 30,
            },
            {
                "id": 3,
                "datetime": datetime(2026, 11, 1, 9, 30),
                "duration": 90,
            },
            {
                "id": 4,
                "datetime": datetime(2026, 11, 1, 11, 0),
                "duration": 30,
            },
            {
                "id": 5,
                "datetime": datetime(2026, 11, 1, 10, 40),
                "duration": 0,
            },
            {
                "id": 6,
                "datetime": "not-a-date",
                "duration": 30,
            },
        ]

        result = filter_rows_by_window(
            rows,
            "2026-11-01T10:00:00",
            "2026-11-01T11:00:00",
        )

        self.assertEqual([row["id"] for row in result], [2, 3, 5])

    def test_window_rejects_invalid_or_empty_range(self):
        rows = [{"id": 1, "datetime": datetime(2026, 11, 1, 10, 15), "duration": 30}]

        self.assertEqual(filter_rows_by_window(rows, "", ""), [])
        self.assertEqual(
            filter_rows_by_window(
                rows,
                "2026-11-01T11:00:00",
                "2026-11-01T10:00:00",
            ),
            [],
        )

    def test_case_applies_window_filter(self):
        rows = [
            {
                "id": 20,
                "title": "Dentro de la ventana",
                "description": "",
                "datetime": datetime(2026, 11, 1, 10, 15),
                "duration": 30,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
            {
                "id": 21,
                "title": "Fuera de la ventana",
                "description": "",
                "datetime": datetime(2026, 11, 1, 12, 0),
                "duration": 30,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
        ]
        request = event_pb2.EventsByLocationsRequest(
            locations=["Sala 2 Impresionismo"],
            start_datetime="2026-11-01T10:00:00",
            end_datetime="2026-11-01T11:00:00",
        )

        with patch(
            "app.cases.get_events_by_locations.fetch_event_rows",
            return_value=rows,
        ):
            response = get_events_by_locations(request)

        self.assertEqual([event.id for event in response.events], [20])

    def test_case_applies_only_future_filter(self):
        rows = [
            {
                "id": 10,
                "title": "Evento futuro",
                "description": "",
                "datetime": datetime(2099, 1, 1, 10, 0),
                "duration": 60,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
            {
                "id": 11,
                "title": "Evento pasado",
                "description": "",
                "datetime": datetime(2000, 1, 1, 10, 0),
                "duration": 60,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
        ]
        future_request = event_pb2.EventsByLocationsRequest(
            locations=["Sala 2 Impresionismo"],
            only_future=True,
        )
        all_request = event_pb2.EventsByLocationsRequest(
            locations=["Sala 2 Impresionismo"],
        )

        with patch(
            "app.cases.get_events_by_locations.fetch_event_rows",
            return_value=rows,
        ):
            future_response = get_events_by_locations(future_request)
            all_response = get_events_by_locations(all_request)

        self.assertEqual([event.id for event in future_response.events], [10])
        self.assertEqual([event.id for event in all_response.events], [10, 11])


if __name__ == "__main__":
    unittest.main()
