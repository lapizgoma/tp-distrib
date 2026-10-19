import unittest
from unittest.mock import patch

from app.cases.get_user_profile import (
    UserNotFoundError,
    get_user_profile,
    parse_json_list,
    preferences_to_proto,
)
from app.generated import user_pb2


class GetUserProfileTest(unittest.TestCase):
    def test_parses_json_list_from_string(self):
        self.assertEqual(
            parse_json_list('["Nature", "Mythology"]'),
            ["Nature", "Mythology"],
        )

    def test_parses_json_list_from_list(self):
        self.assertEqual(parse_json_list(["Oil", "Sculpture"]), ["Oil", "Sculpture"])

    def test_parses_json_list_from_bytes(self):
        self.assertEqual(parse_json_list(b'["Oil"]'), ["Oil"])

    def test_returns_empty_for_invalid_or_empty_values(self):
        self.assertEqual(parse_json_list(None), [])
        self.assertEqual(parse_json_list(""), [])
        self.assertEqual(parse_json_list("not-json"), [])
        self.assertEqual(parse_json_list('{"not": "a list"}'), [])

    def test_maps_preferences_to_proto(self):
        proto = preferences_to_proto(
            {
                "favorite_topics": '["Nature"]',
                "favorite_techniques": '["Oil", "Sculpture"]',
                "favorite_eras": '["Renaissance"]',
            }
        )

        self.assertEqual(list(proto.favorite_topics), ["Nature"])
        self.assertEqual(list(proto.favorite_techniques), ["Oil", "Sculpture"])
        self.assertEqual(list(proto.favorite_eras), ["Renaissance"])

    def test_maps_missing_preferences_to_empty_proto(self):
        proto = preferences_to_proto(None)

        self.assertEqual(list(proto.favorite_topics), [])
        self.assertEqual(list(proto.favorite_techniques), [])
        self.assertEqual(list(proto.favorite_eras), [])

    def test_builds_complete_profile_response(self):
        user_row = {
            "id": 4,
            "email": "visitante@museo.com",
            "first_name": "Visitante",
            "last_name": "Sistema",
            "role": "VISITANTE",
        }
        preferences_row = {
            "favorite_topics": '["Nature"]',
            "favorite_techniques": '["Oil"]',
            "favorite_eras": '["Impressionism"]',
        }

        with patch(
            "app.cases.get_user_profile.fetch_one",
            side_effect=[user_row, preferences_row],
        ), patch(
            "app.cases.get_user_profile.fetch_all",
            return_value=[{"work_id": 5}, {"work_id": 9}],
        ):
            response = get_user_profile(user_pb2.UserProfileRequest(user_id=4))

        self.assertEqual(response.user_id, 4)
        self.assertEqual(response.email, "visitante@museo.com")
        self.assertEqual(list(response.preferences.favorite_topics), ["Nature"])
        self.assertEqual(list(response.interacted_work_ids), [5, 9])

    def test_raises_when_user_does_not_exist(self):
        with patch("app.cases.get_user_profile.fetch_one", return_value=None):
            with self.assertRaises(UserNotFoundError):
                get_user_profile(user_pb2.UserProfileRequest(user_id=999))


if __name__ == "__main__":
    unittest.main()
