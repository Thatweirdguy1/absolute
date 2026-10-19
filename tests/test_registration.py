import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from auth import PASSWORD_HASHER, RegistrationError, initialize_auth, register, verify_email


SETTINGS = {"SMTP_HOST": "smtp.example.test", "SMTP_FROM": "absolute@example.test", "SMTP_USER": "user", "SMTP_PASSWORD": "secret", "ABSOLUTE_BASE_URL": "http://127.0.0.1:8765"}
ACCOUNT = {"email": "Film@Example.test", "username": "film_fan", "display_name": "🎬 Film Fan", "password": "a long unique passphrase"}


class RegistrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Path(self.temp.name) / "accounts.db"
        with closing(sqlite3.connect(self.db)) as connection, connection:
            initialize_auth(connection)

    def tearDown(self):
        self.temp.cleanup()

    @patch("auth.send_verification")
    def test_register_hashes_password_and_verifies_once(self, send):
        register(self.db, ACCOUNT, "127.0.0.1", SETTINGS)
        with closing(sqlite3.connect(self.db)) as connection, connection:
            email, username, display, hashed, verified = connection.execute("SELECT email, username, display_name, password_hash, verified_at FROM users").fetchone()
        self.assertEqual((email, username, display), ("film@example.test", "film_fan", "🎬 Film Fan"))
        self.assertIsNone(verified)
        self.assertNotIn(ACCOUNT["password"], hashed)
        self.assertTrue(PASSWORD_HASHER.verify(hashed, ACCOUNT["password"]))
        token = send.call_args.args[2]
        verify_email(self.db, token)
        with closing(sqlite3.connect(self.db)) as connection, connection:
            self.assertIsNotNone(connection.execute("SELECT verified_at FROM users").fetchone()[0])
        with self.assertRaises(RegistrationError):
            verify_email(self.db, token)

    @patch("auth.send_verification")
    def test_unique_names_and_registration_limit(self, send):
        register(self.db, ACCOUNT, "127.0.0.1", SETTINGS)
        for _ in range(4):
            with self.assertRaisesRegex(RegistrationError, "unavailable"):
                register(self.db, ACCOUNT, "127.0.0.1", SETTINGS)
        with self.assertRaisesRegex(RegistrationError, "Too many"):
            register(self.db, ACCOUNT, "127.0.0.1", SETTINGS)
        with closing(sqlite3.connect(self.db)) as connection, connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM users").fetchone()[0], 1)

    def test_mail_not_configured_creates_no_user(self):
        with self.assertRaisesRegex(RegistrationError, "not configured"):
            register(self.db, ACCOUNT, "127.0.0.1", {})
        with closing(sqlite3.connect(self.db)) as connection, connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM users").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
