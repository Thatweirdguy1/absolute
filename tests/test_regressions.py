import csv
import gc
import io
import json
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import warnings
import zipfile
from contextlib import closing
from pathlib import Path
from unittest import mock

import app


def letterboxd_zip(**files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, rows in files.items():
            output = io.StringIO(newline="")
            fields = list(rows[0]) if rows else ["Name", "Year", "Letterboxd URI"]
            writer = csv.DictWriter(output, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
            archive.writestr(name, output.getvalue().encode("utf-8-sig"))
    return buffer.getvalue()


def archive_with(database, outputs=None):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.write(database, "absolute.db")
        for name, content in (outputs or {}).items():
            archive.writestr(f"output/{name}", content)
    return buffer.getvalue()


class TemporaryAbsoluteTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.originals = app.DB_PATH, app.BACKUPS, app.OUTPUT, dict(app.import_job)
        app.DB_PATH = self.root / "data" / "absolute.db"
        app.BACKUPS = self.root / "data" / "backups"
        app.OUTPUT = self.root / "output"
        app.import_job = {"state": "idle", "progress": 0, "message": "", "imported": 0, "skipped": 0, "error": None}
        app.initialize_db()

    def tearDown(self):
        app.DB_PATH, app.BACKUPS, app.OUTPUT, app.import_job = self.originals
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", ResourceWarning)
            gc.collect()
        self.temp.cleanup()

    def execute(self, sql, parameters=()):
        with closing(sqlite3.connect(app.DB_PATH)) as connection, connection:
            connection.execute(sql, parameters)

    def fetchone(self, sql, parameters=()):
        with closing(sqlite3.connect(app.DB_PATH)) as connection:
            return connection.execute(sql, parameters).fetchone()

    def add_movie(self, tmdb_id, title="Synthetic", year="2024"):
        metadata = {"id": tmdb_id, "title": title, "release_date": f"{year}-01-01"}
        self.execute("INSERT INTO movies VALUES (?, ?, 1)", (tmdb_id, json.dumps(metadata)))


class LetterboxdParsingTests(TemporaryAbsoluteTest):
    def test_reads_only_active_root_csvs_and_decodes_bom(self):
        payload = letterboxd_zip(
            **{
                "watched.csv": [{"Name": "Amelie", "Year": "2001", "Letterboxd URI": "https://boxd.it/abc"}],
                "deleted/watched.csv": [{"Name": "Deleted", "Year": "1999", "Letterboxd URI": "https://boxd.it/old"}],
                "notes.txt": [{"text": "ignored"}],
            }
        )
        files = app.read_letterboxd_files(payload)
        self.assertEqual(set(files), {"watched.csv"})
        self.assertEqual(files["watched.csv"][0]["Name"], "Amelie")

    def test_rejects_zip_without_letterboxd_csv(self):
        with self.assertRaisesRegex(ValueError, "No Letterboxd CSV"):
            app.read_letterboxd_files(letterboxd_zip(**{"notes.csv": [{"Name": "Nope"}]}))

    def test_title_index_is_casefolded_and_prefers_canonical_activity_url(self):
        files = {
            "diary.csv": [{"Name": "THE FILM", "Year": "2024", "Letterboxd URI": "https://boxd.it/viewing"}],
            "watched.csv": [{"Name": "The Film", "Year": "2024", "Letterboxd URI": "https://boxd.it/film"}],
        }
        self.assertEqual(app.import_titles(files), {("the film", "2024"): ("The Film", "2024", "https://boxd.it/film")})

    def test_preview_reports_only_real_local_conflicts(self):
        self.execute("INSERT INTO import_aliases VALUES ('the film', '2024', 10)")
        self.execute("INSERT INTO movie_state VALUES (10, 1, 0, 4.5, 'local review', 0, 1)")
        files = {
            "ratings.csv": [{"Name": "The Film", "Year": "2024", "Rating": "3.5", "Review": "", "Letterboxd URI": ""}],
            "reviews.csv": [{"Name": "The Film", "Year": "2024", "Rating": "", "Review": "export review", "Letterboxd URI": ""}],
        }
        conflicts, snapshot = app.preview_letterboxd(files)
        self.assertEqual(snapshot, {10: (4.5, "local review")})
        self.assertEqual({item["field"] for item in conflicts}, {"rating", "review"})


class DiaryReconciliationTests(TemporaryAbsoluteTest):
    def import_viewing(self, **changes):
        values = {"tmdb_id": 10, "watched_on": "2026-01-02", "rewatch": False, "rating": 4.0, "review": "export review"}
        values.update(changes)
        with closing(sqlite3.connect(app.DB_PATH)) as connection, connection:
            app.import_diary_viewing(connection, **values)

    def test_duplicate_export_viewing_is_idempotent(self):
        self.import_viewing()
        self.import_viewing()
        self.assertEqual(self.fetchone("SELECT COUNT(*) FROM diary")[0], 1)

    def test_blank_review_is_enriched_once(self):
        self.import_viewing(review="")
        self.import_viewing(review="export review")
        self.assertEqual(self.fetchone("SELECT review FROM diary")[0], "export review")

    def test_local_review_is_not_overwritten(self):
        self.import_viewing(review="local edit")
        self.import_viewing(review="export review")
        self.assertEqual(self.fetchone("SELECT review FROM diary")[0], "local edit")

    def test_ambiguous_same_day_viewing_is_not_duplicated(self):
        self.import_viewing(rating=3.0, review="first")
        self.import_viewing(rating=4.0, review="second")
        self.assertEqual(self.fetchone("SELECT COUNT(*) FROM diary")[0], 1)


class ImportSafetyTests(TemporaryAbsoluteTest):
    def setUp(self):
        super().setUp()
        self.add_movie(10, "The Film")
        self.execute("INSERT INTO import_aliases VALUES ('the film', '2024', 10)")

    def test_import_applies_synthetic_export_without_network(self):
        payload = letterboxd_zip(
            **{
                "ratings.csv": [{"Name": "The Film", "Year": "2024", "Rating": "4.5", "Letterboxd URI": ""}],
                "reviews.csv": [{"Name": "The Film", "Year": "2024", "Rating": "4.5", "Review": "export review", "Watched Date": "2026-01-02", "Rewatch": "No", "Letterboxd URI": ""}],
                "diary.csv": [{"Name": "The Film", "Year": "2024", "Rating": "4.5", "Review": "", "Watched Date": "2026-01-02", "Rewatch": "No", "Letterboxd URI": ""}],
            }
        )
        with mock.patch.object(app, "tmdb_get", side_effect=AssertionError("network not expected")):
            app.import_letterboxd(payload, set())
        self.assertEqual(app.import_job["state"], "complete")
        self.assertEqual(self.fetchone("SELECT watched, rating, review FROM movie_state WHERE tmdb_id=10"), (1, 4.5, "export review"))
        self.assertEqual(self.fetchone("SELECT watched_on, rating, review FROM diary WHERE tmdb_id=10"), ("2026-01-02", 4.5, "export review"))
        self.assertEqual(app.import_job["report"]["source"], {"ratings": 1, "reviews": 1, "diary": 1})

    def test_keep_local_choices_preserve_rating_review_and_unrelated_rows(self):
        self.execute("INSERT INTO movie_state VALUES (10, 1, 0, 5, 'local review', 1, 9)")
        self.execute("INSERT INTO comments (tmdb_id, body, created_at) VALUES (999, 'unrelated', 1)")
        payload = letterboxd_zip(**{"ratings.csv": [{"Name": "The Film", "Year": "2024", "Rating": "2.5", "Review": "export review", "Letterboxd URI": ""}]})
        app.import_letterboxd(payload, {"10:rating", "10:review"})
        self.assertEqual(self.fetchone("SELECT rating, review, spoiler FROM movie_state WHERE tmdb_id=10"), (5.0, "local review", 1))
        self.assertEqual(self.fetchone("SELECT body FROM comments WHERE tmdb_id=999")[0], "unrelated")

    def test_unmatched_title_is_reported_and_does_not_create_state(self):
        payload = letterboxd_zip(**{"watched.csv": [{"Name": "Unknown", "Year": "1900", "Letterboxd URI": ""}]})
        with mock.patch.object(app, "resolve_movie", return_value=None):
            app.import_letterboxd(payload, set())
        self.assertEqual(app.import_job["report"]["skipped"], 1)
        self.assertEqual(self.fetchone("SELECT COUNT(*) FROM movie_state")[0], 0)

    def test_failed_import_records_error_without_mutating_existing_state(self):
        self.execute("INSERT INTO movie_state VALUES (10, 1, 0, 5, 'safe', 0, 1)")
        app.import_letterboxd(b"not a zip", set())
        self.assertEqual(app.import_job["state"], "error")
        self.assertEqual(self.fetchone("SELECT rating, review FROM movie_state WHERE tmdb_id=10"), (5.0, "safe"))


class ActivityMigrationTests(TemporaryAbsoluteTest):
    def test_move_activity_merges_state_and_moves_dependents(self):
        self.add_movie(1, "Wrong")
        self.add_movie(2, "Right")
        self.execute("INSERT INTO movie_state VALUES (1, 1, 0, 4, 'old', 1, 9)")
        self.execute("INSERT INTO movie_state VALUES (2, 0, 1, NULL, '', 0, 5)")
        self.execute("INSERT INTO diary (tmdb_id, watched_on, review, created_at) VALUES (1, '2026-01-01', 'note', 1)")
        self.execute("INSERT INTO comments (tmdb_id, body, created_at) VALUES (1, 'comment', 1)")
        app.move_activity(1, 2)
        self.assertEqual(self.fetchone("SELECT watched, watchlist, rating, review, spoiler, updated_at FROM movie_state WHERE tmdb_id=2"), (1, 1, 4.0, "old", 1, 9))
        self.assertEqual(self.fetchone("SELECT tmdb_id FROM diary")[0], 2)
        self.assertEqual(self.fetchone("SELECT tmdb_id FROM comments")[0], 2)
        self.assertIsNone(self.fetchone("SELECT 1 FROM movies WHERE tmdb_id=1"))

    def test_move_activity_deduplicates_identical_diary_entries(self):
        for tmdb_id in (1, 2):
            self.execute("INSERT INTO diary (tmdb_id, watched_on, review, created_at) VALUES (?, '2026-01-01', 'same', 1)", (tmdb_id,))
        app.move_activity(1, 2)
        self.assertEqual(self.fetchone("SELECT COUNT(*) FROM diary WHERE tmdb_id=2")[0], 1)

    def test_old_metadata_is_retained_while_still_referenced(self):
        self.add_movie(1, "Wrong")
        self.execute("INSERT INTO import_aliases VALUES ('other alias', '2020', 1)")
        app.move_activity(1, 2)
        self.assertIsNotNone(self.fetchone("SELECT 1 FROM movies WHERE tmdb_id=1"))


class BackupRestoreTests(TemporaryAbsoluteTest):
    def test_backup_restore_round_trip_includes_safe_output_files(self):
        self.add_movie(7, "Before")
        app.OUTPUT.mkdir()
        (app.OUTPUT / "spectrum.svg").write_text("<svg>safe</svg>", encoding="utf-8")
        (app.OUTPUT / "ignored.txt").write_text("ignore", encoding="utf-8")
        payload = app.backup_archive()
        self.execute("DELETE FROM movies")
        (app.OUTPUT / "spectrum.svg").write_text("changed", encoding="utf-8")
        app.restore_archive(payload)
        self.assertEqual(json.loads(self.fetchone("SELECT metadata_json FROM movies WHERE tmdb_id=7")[0])["title"], "Before")
        self.assertEqual((app.OUTPUT / "spectrum.svg").read_text(encoding="utf-8"), "<svg>safe</svg>")
        self.assertEqual((app.OUTPUT / "ignored.txt").read_text(encoding="utf-8"), "ignore")
        self.assertEqual(len(list(app.BACKUPS.glob("*-pre-restore.zip"))), 1)

    def test_restore_rejects_missing_database_without_touching_live_data(self):
        self.add_movie(7, "Safe")
        payload = letterboxd_zip(**{"watched.csv": [{"Name": "Not backup"}]})
        with self.assertRaisesRegex(ValueError, "does not contain absolute.db"):
            app.restore_archive(payload)
        self.assertIsNotNone(self.fetchone("SELECT 1 FROM movies WHERE tmdb_id=7"))

    def test_restore_rejects_non_absolute_database(self):
        foreign = self.root / "foreign.db"
        with closing(sqlite3.connect(foreign)) as connection, connection:
            connection.execute("CREATE TABLE unrelated (id INTEGER)")
        with self.assertRaisesRegex(ValueError, "not an Absolute archive"):
            app.restore_archive(archive_with(foreign))


class ActivityHttpTests(TemporaryAbsoluteTest):
    def setUp(self):
        super().setUp()
        self.server = app.ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        super().tearDown()

    def post(self, tmdb_id, payload):
        request = urllib.request.Request(
            f"{self.base}/api/activity/{tmdb_id}",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "Origin": self.base},
        )
        with urllib.request.urlopen(request, timeout=3) as response:
            return response.status, json.load(response)

    def test_log_edit_and_delete_round_trip(self):
        status, record = self.post(42, {"action": "log", "watched_on": "2026-02-03", "rewatch": True, "rating": 4.5, "review": "first"})
        self.assertEqual(status, 200)
        log_id = record["logs"][0]["id"]
        _, record = self.post(42, {"action": "edit_log", "id": log_id, "watched_on": "2026-02-04", "rewatch": False, "rating": 3.5, "review": "edited"})
        self.assertEqual((record["logs"][0]["watched_on"], record["logs"][0]["review"]), ("2026-02-04", "edited"))
        _, record = self.post(42, {"action": "delete_log", "id": log_id})
        self.assertEqual(record["logs"], [])

    def test_comment_edit_and_delete_round_trip(self):
        _, record = self.post(42, {"action": "comment", "body": "private note"})
        comment_id = record["comments"][0]["id"]
        _, record = self.post(42, {"action": "edit_comment", "id": comment_id, "body": "edited note"})
        self.assertEqual(record["comments"][0]["body"], "edited note")
        _, record = self.post(42, {"action": "delete_comment", "id": comment_id})
        self.assertEqual(record["comments"], [])

    def test_cannot_edit_another_movies_log(self):
        _, record = self.post(1, {"action": "log", "watched_on": "2026-02-03"})
        log_id = record["logs"][0]["id"]
        with self.assertRaises(urllib.error.HTTPError) as caught:
            self.post(2, {"action": "edit_log", "id": log_id, "watched_on": "2026-02-04"})
        self.assertEqual(caught.exception.code, 400)
        self.assertEqual(self.fetchone("SELECT tmdb_id, watched_on FROM diary WHERE id=?", (log_id,)), (1, "2026-02-03"))

    def test_rejects_invalid_rating_and_date(self):
        for payload in (
            {"action": "state", "rating": 4.2},
            {"action": "log", "watched_on": "03/02/2026"},
        ):
            with self.subTest(payload=payload), self.assertRaises(urllib.error.HTTPError) as caught:
                self.post(42, payload)
            self.assertEqual(caught.exception.code, 400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
