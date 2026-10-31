import unittest
from datetime import datetime

from app.cases.tour_planner import WorkCandidate, parse_topics
from app.cases.tour_schedule import (
    InvalidStartDatetime,
    RoomSlot,
    build_room_schedule,
    format_local_datetime,
    parse_local_datetime,
)


def make_work(
    work_id,
    *,
    location="SALA_2_IMPRESIONISMO",
    duration=10,
    topic="Nature",
):
    return WorkCandidate(
        id=work_id,
        title=f"Work {work_id}",
        artist_id=1,
        artist_name="Artist",
        image_url="",
        creation_year=1900,
        technique="OLEO",
        dimensions="",
        era="IMPRESIONISMO",
        topic=topic,
        topics=parse_topics(topic),
        description="",
        location=location,
        availability="EN_EXHIBICION",
        estimated_duration_minutes=duration,
    )


class LocalDateTimeTest(unittest.TestCase):
    def test_formats_local_datetime(self):
        self.assertEqual(
            format_local_datetime(datetime(2026, 11, 1, 10, 5, 7)),
            "2026-11-01T10:05:07",
        )

    def test_parses_minutes_and_seconds(self):
        self.assertEqual(
            parse_local_datetime("2026-11-01T10:05"),
            datetime(2026, 11, 1, 10, 5),
        )
        self.assertEqual(
            parse_local_datetime("2026-11-01T10:05:07"),
            datetime(2026, 11, 1, 10, 5, 7),
        )

    def test_rejects_invalid_or_normalized_values(self):
        self.assertIsNone(parse_local_datetime(None))
        self.assertIsNone(parse_local_datetime(123))
        self.assertIsNone(parse_local_datetime("01/11/2026 10:00"))
        self.assertIsNone(parse_local_datetime("2026-02-31T10:00"))
        self.assertIsNone(parse_local_datetime("2026-11-01T10:00:60"))


class BuildRoomScheduleTest(unittest.TestCase):
    def test_builds_single_room_schedule(self):
        works = [make_work(1, duration=10), make_work(2, duration=15)]

        schedule = build_room_schedule(
            works,
            ["sala_2_impresionismo"],
            total_duration_minutes=25,
            start_datetime="2026-11-01T10:00",
        )

        self.assertEqual(schedule.start_datetime, "2026-11-01T10:00:00")
        self.assertEqual(schedule.end_datetime, "2026-11-01T10:25:00")
        self.assertEqual(
            schedule.room_schedule,
            (
                RoomSlot(
                    room="sala_2_impresionismo",
                    start_datetime="2026-11-01T10:00:00",
                    end_datetime="2026-11-01T10:25:00",
                ),
            ),
        )

    def test_adds_transitions_between_rooms(self):
        works = [
            make_work(1, location="SALA_2_IMPRESIONISMO", duration=10),
            make_work(2, location="SALA_2_IMPRESIONISMO", duration=10),
            make_work(3, location="SALA_4_ARTE_MODERNO", duration=10),
        ]

        schedule = build_room_schedule(
            works,
            ["sala_2_impresionismo", "sala_4_arte_moderno"],
            total_duration_minutes=35,
            start_datetime="2026-11-01T10:00",
        )

        self.assertEqual(schedule.start_datetime, "2026-11-01T10:00:00")
        self.assertEqual(schedule.end_datetime, "2026-11-01T10:35:00")
        self.assertEqual(
            [(slot.room, slot.start_datetime, slot.end_datetime) for slot in schedule.room_schedule],
            [
                ("sala_2_impresionismo", "2026-11-01T10:00:00", "2026-11-01T10:20:00"),
                ("sala_4_arte_moderno", "2026-11-01T10:25:00", "2026-11-01T10:35:00"),
            ],
        )

    def test_empty_plan_starts_and_ends_at_same_time(self):
        schedule = build_room_schedule(
            [],
            [],
            total_duration_minutes=0,
            start_datetime="2026-11-01T10:00",
        )

        self.assertEqual(schedule.start_datetime, "2026-11-01T10:00:00")
        self.assertEqual(schedule.end_datetime, "2026-11-01T10:00:00")
        self.assertEqual(schedule.room_schedule, ())

    def test_invalid_start_raises(self):
        with self.assertRaises(InvalidStartDatetime):
            build_room_schedule([], [], 0, "2026-13-01T10:00")

    def test_normalizes_room_names(self):
        works = [make_work(1, location="Sala 2 Impresionismo", duration=10)]

        schedule = build_room_schedule(
            works,
            ["Sala 2 Impresionismo"],
            total_duration_minutes=10,
            start_datetime="2026-11-01T10:00",
        )

        self.assertEqual(schedule.room_schedule[0].room, "sala_2_impresionismo")


if __name__ == "__main__":
    unittest.main()
