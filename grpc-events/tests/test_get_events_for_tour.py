import unittest
from datetime import datetime
from unittest.mock import patch

from app.cases.event_helpers import filter_rows_by_room_schedule
from app.cases.get_events_for_tour import get_events_for_tour
from app.generated import event_pb2


def slot(room, start, end):
    return event_pb2.RoomScheduleSlot(
        room=room,
        start_datetime=start,
        end_datetime=end,
    )


class FilterRowsByRoomScheduleTest(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {
                "id": 1,
                "datetime": datetime(2026, 11, 1, 10, 10),
                "duration": 15,
                "location": "SALA_2_IMPRESIONISMO",
            },
            {
                "id": 2,
                "datetime": datetime(2026, 11, 1, 10, 35),
                "duration": 10,
                "location": "SALA_2_IMPRESIONISMO",
            },
            {
                "id": 3,
                "datetime": datetime(2026, 11, 1, 10, 40),
                "duration": 5,
                "location": "SALA_4_ARTE_MODERNO",
            },
            {
                "id": 4,
                "datetime": datetime(2026, 11, 1, 10, 20),
                "duration": 30,
                "location": "SALA_4_ARTE_MODERNO",
            },
            {
                "id": 5,
                "datetime": datetime(2026, 11, 1, 10, 15),
                "duration": 10,
                "location": "SALA_1_GRANDES_MAESTROS",
            },
            {
                "id": 6,
                "datetime": "not-a-date",
                "duration": 10,
                "location": "SALA_2_IMPRESIONISMO",
            },
        ]

    def test_keeps_events_overlapping_their_room_slot(self):
        schedule = [
            slot("sala_2_impresionismo", "2026-11-01T10:00:00", "2026-11-01T10:30:00"),
            slot("sala_4_arte_moderno", "2026-11-01T10:35:00", "2026-11-01T10:50:00"),
        ]

        result = filter_rows_by_room_schedule(self.rows, schedule)

        self.assertEqual([row["id"] for row in result], [1, 3, 4])

    def test_zero_duration_event_counts_only_if_it_starts_inside(self):
        rows = [
            {"id": 1, "datetime": "2026-11-01T10:15:00", "duration": 0, "location": "SALA_2_IMPRESIONISMO"},
            {"id": 2, "datetime": "2026-11-01T10:30:00", "duration": 0, "location": "SALA_2_IMPRESIONISMO"},
        ]
        schedule = [
            slot("sala_2_impresionismo", "2026-11-01T10:00:00", "2026-11-01T10:30:00"),
        ]

        result = filter_rows_by_room_schedule(rows, schedule)

        self.assertEqual([row["id"] for row in result], [1])

    def test_ignores_rooms_outside_the_schedule(self):
        rows = [
            {"id": 1, "datetime": "2026-11-01T10:15:00", "duration": 10, "location": "SALA_1_GRANDES_MAESTROS"},
        ]
        schedule = [
            slot("sala_2_impresionismo", "2026-11-01T10:00:00", "2026-11-01T10:30:00"),
        ]

        self.assertEqual(filter_rows_by_room_schedule(rows, schedule), [])

    def test_ignores_invalid_slots(self):
        rows = [
            {"id": 1, "datetime": "2026-11-01T10:15:00", "duration": 10, "location": "SALA_2_IMPRESIONISMO"},
        ]
        schedule = [
            slot("sala_2_impresionismo", "2026-11-01T10:30:00", "2026-11-01T10:00:00"),
            slot("sala_2_impresionismo", "not-a-date", "2026-11-01T10:30:00"),
        ]

        self.assertEqual(filter_rows_by_room_schedule(rows, schedule), [])


class GetEventsForTourTest(unittest.TestCase):
    def test_case_filters_events_using_the_room_schedule(self):
        rows = [
            {
                "id": 20,
                "title": "Durante la primera sala",
                "description": "",
                "datetime": datetime(2026, 11, 1, 10, 10),
                "duration": 15,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
            {
                "id": 21,
                "title": "Fuera de la sala",
                "description": "",
                "datetime": datetime(2026, 11, 1, 10, 35),
                "duration": 10,
                "location": "SALA_2_IMPRESIONISMO",
                "event_type": "EXPOSICION",
                "associated_era": "IMPRESIONISMO",
            },
        ]
        request = event_pb2.EventsForTourRequest(
            room_schedule=[
                slot("sala_2_impresionismo", "2026-11-01T10:00:00", "2026-11-01T10:30:00"),
            ],
        )

        with patch(
            "app.cases.get_events_for_tour.fetch_event_rows",
            return_value=rows,
        ):
            response = get_events_for_tour(request)

        self.assertEqual([event.id for event in response.events], [20])


if __name__ == "__main__":
    unittest.main()
