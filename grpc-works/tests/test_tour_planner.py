import unittest

from app.cases.tour_planner import (
    WorkCandidate,
    calculate_total_duration,
    canonical_era,
    canonical_location,
    canonical_technique,
    parse_topics,
    plan_tour,
)


def make_work(
    work_id,
    *,
    era="IMPRESIONISMO",
    technique="OLEO",
    topic="Nature",
    location="SALA_2_IMPRESIONISMO",
    duration=10,
    creation_year=1900,
    availability="EN_EXHIBICION",
):
    return WorkCandidate(
        id=work_id,
        title=f"Work {work_id}",
        artist_id=1,
        artist_name="Artist",
        image_url="",
        creation_year=creation_year,
        technique=technique,
        dimensions="",
        era=era,
        topic=topic,
        topics=parse_topics(topic),
        description="",
        location=location,
        availability=availability,
        estimated_duration_minutes=duration,
    )


class TourPlannerTest(unittest.TestCase):
    def test_filters_by_topic_era_and_technique(self):
        works = [
            make_work(1, topic="Nature"),
            make_work(2, era="RENACIMIENTO", technique="TEMPLE", topic="Mythology"),
            make_work(3, topic="Nature,Mythology"),
        ]

        result = plan_tour(
            works,
            topics=["Mythology"],
            eras=["Impresionismo"],
            techniques=["óleo"],
        )

        self.assertEqual([work.id for work in result], [3])

    def test_filters_topics_with_or_within_dimension(self):
        works = [
            make_work(1, topic="Nature"),
            make_work(2, topic="Mythology"),
            make_work(3, topic="Portrait"),
        ]

        result = plan_tour(works, topics=["Nature", "Mythology"])

        self.assertEqual({work.id for work in result}, {1, 2})

    def test_excludes_works_in_deposit(self):
        works = [
            make_work(1, availability="EN_DEPOSITO", location="DEPOSITO"),
            make_work(2, availability="EN_EXHIBICION"),
        ]

        result = plan_tour(works)

        self.assertEqual([work.id for work in result], [2])

    def test_respects_max_works_count(self):
        works = [make_work(1), make_work(2), make_work(3)]

        result = plan_tour(works, max_works_count=2)

        self.assertEqual(len(result), 2)

    def test_duration_includes_room_transitions(self):
        works = [
            make_work(1, location="SALA_2_IMPRESIONISMO", duration=10),
            make_work(2, location="SALA_2_IMPRESIONISMO", duration=10),
            make_work(3, location="SALA_3_VANGUARDIAS", duration=10),
        ]

        tight = plan_tour(works, max_duration_minutes=25, transition_minutes=5)
        relaxed = plan_tour(works, max_duration_minutes=35, transition_minutes=5)

        self.assertEqual([work.id for work in tight], [1, 2])
        self.assertEqual([work.id for work in relaxed], [1, 2, 3])
        self.assertEqual(calculate_total_duration(relaxed, 5), 35)

    def test_orders_by_room_and_creation_year(self):
        works = [
            make_work(1, location="SALA_3_VANGUARDIAS", creation_year=1937),
            make_work(2, location="SALA_1_GRANDES_MAESTROS", creation_year=1665),
            make_work(3, location="SALA_2_IMPRESIONISMO", creation_year=1872),
            make_work(4, location="SALA_1_GRANDES_MAESTROS", creation_year=1503),
        ]

        result = plan_tour(works)

        self.assertEqual([work.id for work in result], [4, 2, 3, 1])

    def test_normalizes_accents_and_aliases(self):
        works = [
            make_work(
                1,
                era="CONTEMPORANEO",
                technique="ACRILICO",
                topic="Nature",
            )
        ]

        result = plan_tour(
            works,
            topics=["nature"],
            eras=["Arte Contemporáneo"],
            techniques=["acrílico"],
        )

        self.assertEqual([work.id for work in result], [1])
        self.assertEqual(canonical_era("Arte Contemporáneo"), "contemporaneo")
        self.assertEqual(canonical_technique("óleo"), "oleo")
        self.assertEqual(
            canonical_location("Sala 2 Impresionismo"),
            "sala_2_impresionismo",
        )

    def test_parses_topic_formats(self):
        self.assertEqual(
            parse_topics("Nature, Mythology;Portrait|Landscape"),
            ("nature", "mythology", "portrait", "landscape"),
        )
        self.assertEqual(
            parse_topics('["Nature", "Mythology"]'),
            ("nature", "mythology"),
        )
        self.assertEqual(parse_topics(None), ())

    def test_zero_limits_mean_unlimited(self):
        works = [make_work(1), make_work(2), make_work(3)]

        result = plan_tour(
            works,
            max_duration_minutes=0,
            max_works_count=0,
        )

        self.assertEqual(len(result), 3)

    def test_single_work_has_no_transition_cost(self):
        works = [make_work(1, duration=10)]

        result = plan_tour(works, max_duration_minutes=10, transition_minutes=5)

        self.assertEqual([work.id for work in result], [1])
        self.assertEqual(calculate_total_duration(result, 5), 10)


if __name__ == "__main__":
    unittest.main()
