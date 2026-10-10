from __future__ import annotations

import base64
import csv
import hashlib
import html
import io
import json
import math
import os
import re
import sqlite3
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
import zipfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
OUTPUT = ROOT / "output"
DB_PATH = ROOT / "data" / "absolute.db"
DEFAULT_MOVIE = ROOT / "Teenage Sex and Death at Camp Miasma 2026 1080p.mkv"
SAMPLES = 2048
ALGORITHM = "ASPEC-2"

job_lock = threading.Lock()
job = {"state": "idle", "progress": 0, "message": "Ready", "result": None, "error": None}
import_lock = threading.Lock()
import_job = {"state": "idle", "progress": 0, "message": "Choose your Letterboxd export ZIP", "imported": 0, "skipped": 0, "error": None}
selected_file = DEFAULT_MOVIE if DEFAULT_MOVIE.exists() else None


def load_env() -> dict[str, str]:
    values = dict(os.environ)
    path = ROOT / ".env"
    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                values.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    return values


def run_json(command: list[str]) -> dict:
    completed = subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8")
    return json.loads(completed.stdout)


def probe(path: Path) -> dict:
    payload = run_json([
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration,size,format_name:stream=index,codec_type,codec_name,width,height,pix_fmt,color_space,color_transfer,color_primaries,avg_frame_rate",
        "-of", "json", str(path),
    ])
    video = next(stream for stream in payload["streams"] if stream.get("codec_type") == "video")
    subtitles = [stream for stream in payload["streams"] if stream.get("codec_type") == "subtitle"]
    return {
        "name": path.name,
        "path": str(path),
        "duration": float(payload["format"]["duration"]),
        "size": int(payload["format"]["size"]),
        "width": video.get("width"),
        "height": video.get("height"),
        "codec": video.get("codec_name"),
        "pixel_format": video.get("pix_fmt"),
        "color_transfer": video.get("color_transfer", "unknown"),
        "color_primaries": video.get("color_primaries", "unknown"),
        "frame_rate": video.get("avg_frame_rate", "unknown"),
        "subtitle_tracks": len(subtitles),
    }


def parse_timecode(value: str) -> float:
    parts = value.strip().split(":")
    if len(parts) not in (2, 3):
        raise ValueError("Use HH:MM:SS or MM:SS")
    numbers = [float(part) for part in parts]
    if len(numbers) == 2:
        minutes, seconds = numbers
        hours = 0
    else:
        hours, minutes, seconds = numbers
    if minutes < 0 or minutes >= 60 or seconds < 0 or seconds >= 60:
        raise ValueError("Invalid timecode")
    return hours * 3600 + minutes * 60 + seconds


def format_timecode(seconds: float) -> str:
    value = max(0, round(seconds))
    return f"{value // 3600:02d}:{value % 3600 // 60:02d}:{value % 60:02d}"


def black_segments(path: Path, offset: float, length: float) -> list[dict[str, float]]:
    completed = subprocess.run([
        "ffmpeg", "-hide_banner", "-ss", f"{offset:.3f}", "-t", f"{length:.3f}", "-i", str(path),
        "-an", "-sn", "-vf", "fps=2,scale=160:-2:flags=area,blackdetect=d=0.8:pic_th=0.96:pix_th=0.10",
        "-f", "null", "NUL",
    ], capture_output=True, text=True, encoding="utf-8", errors="replace")
    matches = re.finditer(
        r"black_start:(?P<start>[0-9.]+)\s+black_end:(?P<end>[0-9.]+)\s+black_duration:(?P<duration>[0-9.]+)",
        completed.stderr,
    )
    return [{
        "start": offset + float(match.group("start")),
        "end": offset + float(match.group("end")),
        "duration": float(match.group("duration")),
    } for match in matches]


def suggest_boundaries(path: Path) -> dict:
    duration = probe(path)["duration"]
    opening = black_segments(path, 0, min(180, duration))
    start_options = [item for item in opening if item["duration"] >= 1 and item["end"] <= 120]
    start_pick = max(start_options, key=lambda item: item["end"], default=None)
    tail_length = min(900, duration)
    ending = black_segments(path, duration - tail_length, tail_length)
    end_options = [item for item in ending if item["duration"] >= 5 and item["start"] >= duration * 0.92]
    end_pick = min(end_options, key=lambda item: item["start"], default=None)
    start = start_pick["end"] if start_pick else 0
    end = end_pick["start"] if end_pick else duration
    return {
        "start": format_timecode(start), "end": format_timecode(end),
        "start_confidence": "high" if start_pick and start_pick["duration"] >= 3 else "medium" if start_pick else "low",
        "end_confidence": "high" if end_pick and end_pick["duration"] >= 15 else "medium" if end_pick else "low",
        "note": "Suggested from sustained black and fade transitions. Review both timecodes before creating the Spectrum.",
    }


def srgb_to_linear(channel: int) -> float:
    value = channel / 255.0
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def linear_to_srgb(value: float) -> int:
    value = max(0.0, min(1.0, value))
    encoded = value * 12.92 if value <= 0.0031308 else 1.055 * value ** (1 / 2.4) - 0.055
    return round(encoded * 255)


def rgb_to_oklab(pixel: tuple[int, int, int]) -> tuple[float, float, float]:
    red, green, blue = (srgb_to_linear(channel) for channel in pixel)
    light = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
    medium = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
    short = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue
    light, medium, short = (value ** (1 / 3) for value in (light, medium, short))
    return (
        0.2104542553 * light + 0.7936177850 * medium - 0.0040720468 * short,
        1.9779984951 * light - 2.4285922050 * medium + 0.4505937099 * short,
        0.0259040371 * light + 0.7827717662 * medium - 0.8086757660 * short,
    )


def oklab_to_rgb(color: tuple[float, float, float]) -> tuple[int, int, int]:
    level, green_red, blue_yellow = color
    light = (level + 0.3963377774 * green_red + 0.2158037573 * blue_yellow) ** 3
    medium = (level - 0.1055613458 * green_red - 0.0638541728 * blue_yellow) ** 3
    short = (level - 0.0894841775 * green_red - 1.2914855480 * blue_yellow) ** 3
    return tuple(linear_to_srgb(value) for value in (
        4.0767416621 * light - 3.3077115913 * medium + 0.2309699292 * short,
        -1.2684380046 * light + 2.6097574011 * medium - 0.3413193965 * short,
        -0.0041960863 * light - 0.7034186147 * medium + 1.7076147010 * short,
    ))


def frame_color(frame: bytes) -> tuple[int, int, int]:
    pixels = list(zip(frame[0::3], frame[1::3], frame[2::3]))
    if len(pixels) == 32 * 18:
        rows = [[pixels[y * 32 + x] for x in range(32)] for y in range(18)]
        kept_rows = [row for row in rows if sum(max(pixel) for pixel in row) / 32 > 7]
        if len(kept_rows) >= 8:
            pixels = [pixel for row in kept_rows for pixel in row]
    visible = [pixel for pixel in pixels if max(pixel) > 5]
    if len(visible) >= len(pixels) // 3:
        pixels = visible
    samples = [rgb_to_oklab(pixel) for pixel in pixels]
    ordered = sorted(samples, key=lambda color: color[0])
    centers = [ordered[round((len(ordered) - 1) * point)] for point in (0.2, 0.5, 0.8)]
    groups: list[list[tuple[float, float, float]]] = []
    for _ in range(4):
        groups = [[] for _ in centers]
        for sample in samples:
            index = min(range(3), key=lambda item: sum((sample[channel] - centers[item][channel]) ** 2 for channel in range(3)))
            groups[index].append(sample)
        centers = [
            tuple(sum(color[channel] for color in group) / len(group) for channel in range(3)) if group else centers[index]
            for index, group in enumerate(groups)
        ]
    def score(item: tuple[int, tuple[float, float, float]]) -> float:
        index, (level, green_red, blue_yellow) = item
        chroma = math.hypot(green_red, blue_yellow)
        return len(groups[index]) * (0.45 + min(chroma / 0.18, 1)) * (0.55 + min(level, 0.8))
    level, green_red, blue_yellow = max(enumerate(centers), key=score)[1]
    return oklab_to_rgb((level, green_red * 1.08, blue_yellow * 1.08))


def smooth(colors: list[tuple[int, int, int]]) -> list[tuple[int, int, int]]:
    if len(colors) < 3:
        return colors
    perceptual = [rgb_to_oklab(color) for color in colors]
    result = [colors[0]]
    for previous, current, following in zip(perceptual, perceptual[1:], perceptual[2:]):
        result.append(oklab_to_rgb(tuple(previous[i] * 0.15 + current[i] * 0.7 + following[i] * 0.15 for i in range(3))))
    result.append(colors[-1])
    return result


def permanent_id(tmdb_id: int, edition: str, start: float, end: float, colors: list[str]) -> tuple[str, str]:
    payload = json.dumps({
        "algorithm": ALGORITHM,
        "tmdb_id": tmdb_id,
        "edition": edition,
        "start_ms": round(start * 1000),
        "end_ms": round(end * 1000),
        "colors": colors,
    }, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    digest = hashlib.sha256(payload).digest()
    short = base64.b32encode(digest[:20]).decode("ascii").rstrip("=")
    return f"AS2-{short}", digest.hex()


def spectrum_svg(colors: list[str], title: str, spectrum_id: str) -> str:
    rects = "".join(f'<rect x="{index}" width="1" height="512" fill="{color}"/>' for index, color in enumerate(colors))
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="512" viewBox="0 0 2048 512" '
        f'role="img" aria-label="Absolute Spectrum for {html.escape(title, quote=True)}"><title>{html.escape(title)} — {spectrum_id}</title>{rects}</svg>'
    )


def initialize_db() -> None:
    DB_PATH.parent.mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS spectra (
                id TEXT PRIMARY KEY,
                full_hash TEXT NOT NULL,
                tmdb_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                year INTEGER,
                edition TEXT NOT NULL,
                source_path TEXT NOT NULL,
                start_seconds REAL NOT NULL,
                end_seconds REAL NOT NULL,
                algorithm TEXT NOT NULL,
                colors_json TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS movies (
                tmdb_id INTEGER PRIMARY KEY,
                metadata_json TEXT NOT NULL,
                refreshed_at INTEGER NOT NULL
            )
        """)
        connection.execute("""CREATE TABLE IF NOT EXISTS movie_state (
            tmdb_id INTEGER PRIMARY KEY, watched INTEGER NOT NULL DEFAULT 0,
            watchlist INTEGER NOT NULL DEFAULT 0, rating REAL, review TEXT NOT NULL DEFAULT '',
            spoiler INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS diary (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER NOT NULL,
            watched_on TEXT NOT NULL, rewatch INTEGER NOT NULL DEFAULT 0,
            rating REAL, review TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER NOT NULL,
            body TEXT NOT NULL, created_at INTEGER NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS import_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL,
            source_json TEXT NOT NULL, applied_json TEXT NOT NULL, unmatched_json TEXT NOT NULL
        )""")


def valid_rating(value):
    if value in (None, ""):
        return None
    rating = float(value)
    if rating < 0.5 or rating > 5 or rating * 2 != int(rating * 2):
        raise ValueError("Rating must be from 0.5 to 5 in half-star steps")
    return rating


def activity_record(tmdb_id: int) -> dict:
    with sqlite3.connect(DB_PATH) as connection:
        state = connection.execute(
            "SELECT watched, watchlist, rating, review, spoiler, updated_at FROM movie_state WHERE tmdb_id = ?", (tmdb_id,)
        ).fetchone()
        logs = connection.execute(
            "SELECT id, watched_on, rewatch, rating, review, created_at FROM diary WHERE tmdb_id = ? ORDER BY watched_on DESC, id DESC", (tmdb_id,)
        ).fetchall()
        comments = connection.execute(
            "SELECT id, body, created_at FROM comments WHERE tmdb_id = ? ORDER BY id DESC", (tmdb_id,)
        ).fetchall()
    return {
        "state": {"watched": bool(state[0]), "watchlist": bool(state[1]), "rating": state[2], "review": state[3], "spoiler": bool(state[4])} if state else
                 {"watched": False, "watchlist": False, "rating": None, "review": "", "spoiler": False},
        "logs": [{"id": row[0], "watched_on": row[1], "rewatch": bool(row[2]), "rating": row[3], "review": row[4], "created_at": row[5]} for row in logs],
        "comments": [{"id": row[0], "body": row[1], "created_at": row[2]} for row in comments],
    }


def upsert_state(connection, tmdb_id: int, **changes) -> None:
    current = activity_record(tmdb_id)["state"]
    current.update(changes)
    connection.execute("""INSERT INTO movie_state (tmdb_id, watched, watchlist, rating, review, spoiler, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(tmdb_id) DO UPDATE SET
        watched=excluded.watched, watchlist=excluded.watchlist, rating=excluded.rating,
        review=excluded.review, spoiler=excluded.spoiler, updated_at=excluded.updated_at""",
        (tmdb_id, int(current["watched"]), int(current["watchlist"]), current["rating"], current["review"], int(current["spoiler"]), int(time.time())))


def cached_movie(name: str, year: str) -> int | None:
    target = name.casefold().strip()
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute("SELECT tmdb_id, metadata_json FROM movies").fetchall()
    for tmdb_id, raw in rows:
        item = json.loads(raw)
        if item.get("title", "").casefold().strip() == target and (not year or (item.get("release_date") or "")[:4] == year):
            return tmdb_id
    return None


def resolve_movie(name: str, year: str) -> int | None:
    found = cached_movie(name, year)
    if found:
        return found
    results = tmdb_get("/search/movie", {"query": name, "year": year}).get("results", [])
    if not results:
        return None
    exact = next((item for item in results if not year or (item.get("release_date") or "")[:4] == year), results[0])
    tmdb_id = int(exact["id"])
    # The search result already contains everything the library needs; the full page refreshes it later.
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("INSERT OR REPLACE INTO movies (tmdb_id, metadata_json, refreshed_at) VALUES (?, ?, ?)", (tmdb_id, json.dumps(exact), int(time.time())))
    return tmdb_id


def import_letterboxd(payload: bytes) -> None:
    global import_job
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            files = {}
            for info in archive.infolist():
                # Letterboxd also includes deleted/ and orphaned/ CSVs with the
                # same basenames. Only the active, root-level export is current.
                key = info.filename.lower()
                if key in {"watched.csv", "watchlist.csv", "ratings.csv", "reviews.csv", "diary.csv"}:
                    text = archive.read(info).decode("utf-8-sig", errors="replace")
                    files[key] = list(csv.DictReader(io.StringIO(text)))
        source = {name.removesuffix(".csv"): len(rows) for name, rows in files.items()}
        applied = {name.removesuffix(".csv"): 0 for name in files}
        total = sum(source.values()) or 1
        done = imported = skipped = 0
        unmatched = []
        unique = {}
        for rows in files.values():
            for row in rows:
                lower = {str(key).lower(): value for key, value in row.items()}
                name, year = (lower.get("name") or "").strip(), (lower.get("year") or "").strip()
                if name: unique[(name.casefold(), year)] = (name, year)
        with sqlite3.connect(DB_PATH) as connection:
            cached_rows = connection.execute("SELECT tmdb_id, metadata_json FROM movies").fetchall()
        resolved = {}
        for tmdb_id, raw in cached_rows:
            item = json.loads(raw)
            title, year = item.get("title", "").casefold().strip(), (item.get("release_date") or "")[:4]
            if title: resolved[(title, year)] = tmdb_id
        pending = [(key, value) for key, value in unique.items() if key not in resolved]
        def match(entry):
            key, (name, year) = entry
            try:
                results = tmdb_get("/search/movie", {"query": name, "year": year}).get("results", [])
                if not results: return key, None
                exact = next((item for item in results if not year or (item.get("release_date") or "")[:4] == year), results[0])
                tmdb_id = int(exact["id"])
                with sqlite3.connect(DB_PATH) as connection:
                    connection.execute("INSERT OR REPLACE INTO movies (tmdb_id, metadata_json, refreshed_at) VALUES (?, ?, ?)", (tmdb_id, json.dumps(exact), int(time.time())))
                return key, tmdb_id
            except (urllib.error.URLError, ConnectionError, OSError, RuntimeError): return key, None
        for index, entry in enumerate(pending, 1):
            key, tmdb_id = match(entry)
            resolved[key] = tmdb_id
            with import_lock:
                import_job.update(progress=round(index / max(1, len(pending)) * 70), message=f"Matching {index} of {len(pending)} uncached films…")
        for filename, rows in files.items():
            for row in rows:
                lower = {str(key).lower(): value for key, value in row.items()}
                name, year = (lower.get("name") or "").strip(), (lower.get("year") or "").strip()
                tmdb_id = resolved.get((name.casefold(), year))
                if not tmdb_id:
                    skipped += 1
                    if len(unmatched) < 100: unmatched.append({"name": name, "year": year, "source": filename})
                else:
                    rating = valid_rating(lower.get("rating"))
                    review = (lower.get("review") or "").strip()
                    with sqlite3.connect(DB_PATH) as connection:
                        if filename == "watchlist.csv":
                            upsert_state(connection, tmdb_id, watchlist=True)
                        else:
                            changes = {"watched": True, "watchlist": False}
                            if rating is not None: changes["rating"] = rating
                            if review: changes["review"] = review
                            upsert_state(connection, tmdb_id, **changes)
                        if filename == "diary.csv":
                            watched_on = lower.get("watched date") or lower.get("date") or ""
                            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", watched_on):
                                rewatch = (lower.get("rewatch") or "").lower() in {"yes", "true", "1"}
                                exists = connection.execute("SELECT 1 FROM diary WHERE tmdb_id=? AND watched_on=? AND review=?", (tmdb_id, watched_on, review)).fetchone()
                                if not exists:
                                    connection.execute("INSERT INTO diary (tmdb_id, watched_on, rewatch, rating, review, created_at) VALUES (?, ?, ?, ?, ?, ?)", (tmdb_id, watched_on, int(rewatch), rating, review, int(time.time())))
                    imported += 1
                    applied[filename.removesuffix(".csv")] += 1
                done += 1
                with import_lock:
                    import_job.update(progress=70 + round(done / total * 30), message=f"Applying {done} of {total} records…", imported=imported, skipped=skipped)
        report = {"source": source, "applied": applied, "unmatched": unmatched, "imported": imported, "skipped": skipped}
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute("INSERT INTO import_runs (created_at, source_json, applied_json, unmatched_json) VALUES (?, ?, ?, ?)", (int(time.time()), json.dumps(source), json.dumps(applied), json.dumps(unmatched)))
        with import_lock:
            import_job.update(state="complete", progress=100, message=f"Imported {imported} records · {skipped} unmatched", error=None, report=report)
    except Exception as error:
        with import_lock:
            import_job.update(state="error", message="Letterboxd import failed", error=str(error))


def tmdb_get(endpoint: str, parameters: dict | None = None) -> dict:
    token = load_env().get("TMDB_READ_TOKEN")
    if not token:
        raise RuntimeError("Add TMDB_READ_TOKEN to .env")
    url = "https://api.themoviedb.org/3" + endpoint
    if parameters:
        url += "?" + urllib.parse.urlencode(parameters)
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                return json.load(response)
        except (urllib.error.URLError, ConnectionError, OSError):
            if attempt == 4:
                raise
            time.sleep(0.75 * (attempt + 1))


def spectrum_rows(tmdb_id: int | None = None) -> list[dict]:
    query = "SELECT id, tmdb_id, title, year, edition, start_seconds, end_seconds, algorithm, created_at, colors_json FROM spectra"
    parameters: tuple = ()
    if tmdb_id is not None:
        query += " WHERE tmdb_id = ?"
        parameters = (tmdb_id,)
    query += " ORDER BY created_at DESC"
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(query, parameters).fetchall()
    return [{
        "id": row[0], "tmdb_id": row[1], "title": row[2], "year": row[3], "edition": row[4],
        "start_seconds": row[5], "end_seconds": row[6], "algorithm": row[7], "created_at": row[8],
        "colors": json.loads(row[9]) if tmdb_id is not None else [],
        "svg_url": f"/output/{row[0].lower()}.svg", "json_url": f"/output/{row[0].lower()}.json",
    } for row in rows]


def movie_record(tmdb_id: int) -> dict:
    with sqlite3.connect(DB_PATH) as connection:
        cached = connection.execute("SELECT metadata_json, refreshed_at FROM movies WHERE tmdb_id = ?", (tmdb_id,)).fetchone()
    metadata = json.loads(cached[0]) if cached else {}
    if not cached or time.time() - cached[1] >= 7 * 86400 or "images" not in metadata:
        metadata = tmdb_get(f"/movie/{tmdb_id}", {"append_to_response": "credits,images"})
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute(
                "INSERT OR REPLACE INTO movies (tmdb_id, metadata_json, refreshed_at) VALUES (?, ?, ?)",
                (tmdb_id, json.dumps(metadata), int(time.time())),
            )
    credits = metadata.get("credits", {})
    crew = credits.get("crew", [])
    directors = [person["name"] for person in crew if person.get("job") == "Director"]
    writers = list(dict.fromkeys(person["name"] for person in crew if person.get("department") == "Writing"))[:6]
    return {
        "id": metadata["id"], "title": metadata["title"], "original_title": metadata.get("original_title"),
        "year": (metadata.get("release_date") or "")[:4], "release_date": metadata.get("release_date"),
        "runtime": metadata.get("runtime"), "overview": metadata.get("overview"), "tagline": metadata.get("tagline"),
        "poster_url": f"https://image.tmdb.org/t/p/w780{metadata['poster_path']}" if metadata.get("poster_path") else None,
        "backdrop_url": f"https://image.tmdb.org/t/p/original{metadata['backdrop_path']}" if metadata.get("backdrop_path") else None,
        "backdrops": [f"https://image.tmdb.org/t/p/original{item['file_path']}" for item in metadata.get("images", {}).get("backdrops", [])],
        "genres": [item["name"] for item in metadata.get("genres", [])],
        "countries": [item["name"] for item in metadata.get("production_countries", [])],
        "languages": [item["english_name"] for item in metadata.get("spoken_languages", [])],
        "directors": directors, "writers": writers,
        "posters": [f"https://image.tmdb.org/t/p/w780{item['file_path']}" for item in metadata.get("images", {}).get("posters", [])],
        "cast": [{
            "id": item["id"], "name": item["name"], "character": item.get("character", ""),
            "photo_url": f"https://image.tmdb.org/t/p/w342{item['profile_path']}" if item.get("profile_path") else None,
        } for item in credits.get("cast", [])],
        "crew": [{
            "id": item["id"], "name": item["name"], "job": item.get("job", ""), "department": item.get("department", ""),
            "photo_url": f"https://image.tmdb.org/t/p/w342{item['profile_path']}" if item.get("profile_path") else None,
        } for item in crew],
        "spectra": spectrum_rows(tmdb_id),
    }


def generate(payload: dict) -> None:
    global job
    try:
        path = Path(payload["path"])
        metadata = probe(path)
        start = parse_timecode(payload["start"])
        end = parse_timecode(payload["end"])
        if start >= end or end > metadata["duration"] + 0.5:
            raise ValueError("The selected film range is invalid")
        duration = end - start
        with job_lock:
            job.update(state="running", progress=5, message="Reading the film…", error=None)

        fps = SAMPLES / duration
        command = [
            "ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{duration:.3f}", "-i", str(path),
            "-map", "0:v:0", "-an", "-sn", "-vf", f"fps={fps:.12f},scale=32:18:flags=area,format=rgb24",
            "-frames:v", str(SAMPLES), "-f", "rawvideo", "pipe:1",
        ]
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        frame_size = 32 * 18 * 3
        colors: list[tuple[int, int, int]] = []
        assert process.stdout is not None
        for index in range(SAMPLES):
            frame = process.stdout.read(frame_size)
            if len(frame) != frame_size:
                break
            colors.append(frame_color(frame))
            if index % 32 == 0:
                with job_lock:
                    job.update(progress=5 + round(index / SAMPLES * 82), message="Finding the film’s colours…")
        stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
        if process.wait() != 0:
            raise RuntimeError(stderr.strip() or "FFmpeg could not read the film")
        if len(colors) < SAMPLES * 0.98:
            raise RuntimeError(f"Expected {SAMPLES} samples but decoded {len(colors)}")
        colors = smooth(colors[:SAMPLES])
        hex_colors = [f"#{red:02x}{green:02x}{blue:02x}" for red, green, blue in colors]
        spectrum_id, full_hash = permanent_id(
            int(payload["tmdb_id"]), payload.get("edition", "Theatrical"), start, end, hex_colors
        )
        record = {
            "id": spectrum_id,
            "full_hash": full_hash,
            "tmdb_id": int(payload["tmdb_id"]),
            "title": payload["title"],
            "year": int(payload["year"]) if payload.get("year") else None,
            "edition": payload.get("edition", "Theatrical"),
            "source_path": str(path),
            "start_seconds": start,
            "end_seconds": end,
            "algorithm": ALGORITHM,
            "sample_count": len(hex_colors),
            "colors": hex_colors,
            "source": metadata,
            "created_at": int(time.time()),
        }
        OUTPUT.mkdir(exist_ok=True)
        slug = spectrum_id.lower()
        (OUTPUT / f"{slug}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        (OUTPUT / f"{slug}.svg").write_text(spectrum_svg(hex_colors, payload["title"], spectrum_id), encoding="utf-8")
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute("""
                INSERT OR IGNORE INTO spectra
                (id, full_hash, tmdb_id, title, year, edition, source_path, start_seconds, end_seconds, algorithm, colors_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                spectrum_id, full_hash, record["tmdb_id"], record["title"], record["year"], record["edition"],
                record["source_path"], start, end, ALGORITHM, json.dumps(hex_colors), record["created_at"],
            ))
        record["svg_url"] = f"/output/{slug}.svg"
        record["json_url"] = f"/output/{slug}.json"
        with job_lock:
            job.update(state="complete", progress=100, message="Your Spectrum is ready", result=record)
    except Exception as error:
        with job_lock:
            job.update(state="error", progress=0, message="Could not create the Spectrum", error=str(error))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC), **kwargs)

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def trusted_request(self) -> bool:
        host = self.headers.get("Host", "").split(":", 1)[0].strip("[]").lower()
        origin = self.headers.get("Origin")
        return host in {"127.0.0.1", "localhost", "::1"} and (
            not origin or urllib.parse.urlparse(origin).hostname in {"127.0.0.1", "localhost", "::1"}
        )

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1024 * 1024:
            raise ValueError("Request is too large")
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self) -> None:
        global selected_file
        if not self.trusted_request():
            self.send_error(403)
            return
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/status":
            self.send_json({
                "file": probe(selected_file) if selected_file and selected_file.exists() else None,
                "tmdb_configured": bool(load_env().get("TMDB_READ_TOKEN")),
                "job": job,
            })
            return
        if parsed.path == "/api/job":
            with job_lock:
                self.send_json(dict(job))
            return
        if parsed.path == "/api/import-job":
            with import_lock:
                self.send_json(dict(import_job))
            return
        if parsed.path == "/api/import-report":
            with sqlite3.connect(DB_PATH) as connection:
                row = connection.execute("SELECT created_at, source_json, applied_json, unmatched_json FROM import_runs ORDER BY id DESC LIMIT 1").fetchone()
            self.send_json({"report": {"created_at": row[0], "source": json.loads(row[1]), "applied": json.loads(row[2]), "unmatched": json.loads(row[3])} if row else None})
            return
        if parsed.path.startswith("/api/activity/"):
            try:
                self.send_json(activity_record(int(parsed.path.rsplit("/", 1)[-1])))
            except ValueError:
                self.send_json({"error": "Invalid movie"}, 400)
            return
        if parsed.path == "/api/tmdb/search":
            query = urllib.parse.parse_qs(parsed.query).get("q", [""])[0].strip()
            token = load_env().get("TMDB_READ_TOKEN")
            if not token:
                self.send_json({"error": "Add TMDB_READ_TOKEN to .env"}, 503)
                return
            request = urllib.request.Request(
                "https://api.themoviedb.org/3/search/movie?" + urllib.parse.urlencode({"query": query, "include_adult": "true"}),
                headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            )
            try:
                with urllib.request.urlopen(request, timeout=15) as response:
                    data = json.load(response)
                results = [{
                    "id": item["id"], "title": item["title"],
                    "year": (item.get("release_date") or "")[:4], "overview": item.get("overview", ""),
                } for item in data.get("results", [])[:8]]
                self.send_json({"results": results})
            except urllib.error.HTTPError as error:
                self.send_json({"error": f"TMDB returned {error.code}"}, 502)
            except (urllib.error.URLError, RuntimeError) as error:
                self.send_json({"error": f"TMDB is temporarily unavailable: {error}"}, 503)
            return
        if parsed.path == "/api/popular":
            try:
                page = max(1, min(500, int(urllib.parse.parse_qs(parsed.query).get("page", ["1"])[0])))
                data = tmdb_get("/movie/popular", {"page": page})
                self.send_json({"page": page, "total_pages": data.get("total_pages", 1), "results": [{
                    "id": item["id"], "title": item["title"], "year": (item.get("release_date") or "")[:4],
                    "rating": item.get("vote_average"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{item['poster_path']}" if item.get("poster_path") else None,
                } for item in data.get("results", [])]})
            except (ValueError, KeyError):
                self.send_json({"error": "Invalid page"}, 400)
            except (urllib.error.URLError, RuntimeError) as error:
                self.send_json({"error": f"TMDB is temporarily unavailable: {error}"}, 503)
            return
        if parsed.path.startswith("/api/movie/"):
            try:
                tmdb_id = int(parsed.path.rsplit("/", 1)[-1])
                self.send_json(movie_record(tmdb_id))
            except (ValueError, KeyError):
                self.send_json({"error": "Invalid movie"}, 400)
            except urllib.error.HTTPError as error:
                self.send_json({"error": f"TMDB returned {error.code}"}, 502)
            except (urllib.error.URLError, RuntimeError) as error:
                self.send_json({"error": f"TMDB is temporarily unavailable: {error}"}, 503)
            return
        if parsed.path.startswith("/api/person/"):
            try:
                person_id = int(parsed.path.rsplit("/", 1)[-1])
                person = tmdb_get(f"/person/{person_id}", {"append_to_response": "combined_credits"})
                credits = person.get("combined_credits", {})
                credit = lambda item, role: {
                    "id": item.get("id"), "title": item.get("title") or item.get("name"),
                    "year": (item.get("release_date") or item.get("first_air_date") or "")[:4],
                    "role": role, "media_type": item.get("media_type"), "popularity": item.get("popularity", 0),
                    "poster_url": f"https://image.tmdb.org/t/p/w342{item['poster_path']}" if item.get("poster_path") else None,
                }
                self.send_json({
                    "id": person["id"], "name": person["name"], "biography": person.get("biography"),
                    "birthday": person.get("birthday"), "deathday": person.get("deathday"),
                    "place_of_birth": person.get("place_of_birth"), "known_for": person.get("known_for_department"),
                    "photo_url": f"https://image.tmdb.org/t/p/h632{person['profile_path']}" if person.get("profile_path") else "/default-person.png",
                    "cast": [credit(item, item.get("character") or "Role not listed") for item in credits.get("cast", [])],
                    "crew": [credit(item, item.get("job") or item.get("department") or "Credit not listed") for item in credits.get("crew", [])],
                })
            except (ValueError, KeyError):
                self.send_json({"error": "Invalid person"}, 400)
            except urllib.error.HTTPError as error:
                self.send_json({"error": f"TMDB returned {error.code}"}, 502)
            except (urllib.error.URLError, RuntimeError) as error:
                self.send_json({"error": f"TMDB is temporarily unavailable: {error}"}, 503)
            return
        if parsed.path == "/api/library":
            records = spectrum_rows()
            with sqlite3.connect(DB_PATH) as connection:
                cached = {row[0]: json.loads(row[1]) for row in connection.execute("SELECT tmdb_id, metadata_json FROM movies")}
                states = {row[0]: {"watched": bool(row[1]), "watchlist": bool(row[2]), "rating": row[3], "review": row[4], "spoiler": bool(row[5]), "updated_at": row[6]} for row in connection.execute("SELECT tmdb_id, watched, watchlist, rating, review, spoiler, updated_at FROM movie_state")}
                diary_rows = connection.execute("SELECT id, tmdb_id, watched_on, rewatch, rating, review, created_at FROM diary ORDER BY watched_on DESC, id DESC").fetchall()
            for record in records:
                metadata = cached.get(record["tmdb_id"], {})
                record["poster_url"] = f"https://image.tmdb.org/t/p/w342{metadata['poster_path']}" if metadata.get("poster_path") else None
                record["activity"] = states.get(record["tmdb_id"], {})
            watchlist, watched = [], []
            for tmdb_id, state in states.items():
                metadata = cached.get(tmdb_id, {})
                if metadata:
                    item = {"tmdb_id": tmdb_id, "title": metadata.get("title", "Untitled"), "year": (metadata.get("release_date") or "")[:4], "rating": state["rating"], "review": state["review"], "spoiler": state["spoiler"], "updated_at": state["updated_at"], "poster_url": f"https://image.tmdb.org/t/p/w342{metadata['poster_path']}" if metadata.get("poster_path") else None}
                    if state["watchlist"]: watchlist.append(item)
                    if state["watched"]: watched.append(item)
            diary = []
            for log_id, tmdb_id, watched_on, rewatch, rating, review, created_at in diary_rows:
                metadata = cached.get(tmdb_id, {})
                diary.append({"id": log_id, "tmdb_id": tmdb_id, "title": metadata.get("title", "Untitled"), "year": (metadata.get("release_date") or "")[:4], "poster_url": f"https://image.tmdb.org/t/p/w342{metadata['poster_path']}" if metadata.get("poster_path") else None, "watched_on": watched_on, "rewatch": bool(rewatch), "rating": rating, "review": review, "created_at": created_at})
            reviews = [item for item in watched if item["review"]]
            rated = [item for item in watched if item["rating"] is not None]
            self.send_json({"spectra": records, "watchlist": watchlist, "watched": watched, "diary": diary, "reviews": reviews, "rated": rated})
            return
        if parsed.path == "/api/home":
            with sqlite3.connect(DB_PATH) as connection:
                cached = [json.loads(row[0]) for row in connection.execute("SELECT metadata_json FROM movies ORDER BY refreshed_at DESC")]
            films = [{
                "id": item["id"], "title": item["title"],
                "image_url": f"https://image.tmdb.org/t/p/w780{item['poster_path']}",
            } for item in cached if item.get("poster_path")]
            self.send_json({"films": films})
            return
        if parsed.path.startswith("/output/"):
            candidate = (OUTPUT / Path(parsed.path).name).resolve()
            if candidate.parent != OUTPUT.resolve() or not candidate.exists():
                self.send_error(404)
                return
            content_type = "image/svg+xml" if candidate.suffix == ".svg" else "application/json"
            body = candidate.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/":
            self.path = "/home.html"
        elif parsed.path == "/create":
            self.path = "/index.html"
        elif parsed.path.startswith("/movie/") and parsed.path.rsplit("/", 1)[-1].isdigit():
            self.path = "/movie.html"
        elif re.fullmatch(r"/person/\d+/credits", parsed.path):
            self.path = "/person-credits.html"
        elif parsed.path.startswith("/person/") and parsed.path.rsplit("/", 1)[-1].isdigit():
            self.path = "/person.html"
        elif parsed.path == "/library":
            self.path = "/library.html"
        elif parsed.path == "/browse":
            self.path = "/browse.html"
        super().do_GET()

    def do_POST(self) -> None:
        global selected_file, job, import_job
        if not self.trusted_request():
            self.send_error(403)
            return
        if self.path.startswith("/api/activity/"):
            try:
                tmdb_id = int(self.path.rsplit("/", 1)[-1])
                payload = self.read_json()
                action = payload.get("action")
                with sqlite3.connect(DB_PATH) as connection:
                    if action == "state":
                        changes = {key: payload[key] for key in ("watched", "watchlist", "review", "spoiler") if key in payload}
                        if "rating" in payload: changes["rating"] = valid_rating(payload["rating"])
                        if changes.get("watched"): changes["watchlist"] = False
                        if changes.get("watchlist"): changes["watched"] = False
                        upsert_state(connection, tmdb_id, **changes)
                    elif action == "log":
                        watched_on = str(payload.get("watched_on", ""))
                        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", watched_on):
                            raise ValueError("Choose a valid watched date")
                        rating = valid_rating(payload.get("rating"))
                        review = str(payload.get("review", "")).strip()
                        connection.execute("INSERT INTO diary (tmdb_id, watched_on, rewatch, rating, review, created_at) VALUES (?, ?, ?, ?, ?, ?)", (tmdb_id, watched_on, int(bool(payload.get("rewatch"))), rating, review, int(time.time())))
                        changes = {"watched": True, "watchlist": False}
                        if rating is not None: changes["rating"] = rating
                        if review: changes["review"] = review
                        upsert_state(connection, tmdb_id, **changes)
                    elif action == "comment":
                        body = str(payload.get("body", "")).strip()
                        if not body: raise ValueError("Write a comment first")
                        connection.execute("INSERT INTO comments (tmdb_id, body, created_at) VALUES (?, ?, ?)", (tmdb_id, body, int(time.time())))
                    elif action == "edit_log":
                        log_id, watched_on = int(payload["id"]), str(payload.get("watched_on", ""))
                        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", watched_on): raise ValueError("Choose a valid watched date")
                        rating, review = valid_rating(payload.get("rating")), str(payload.get("review", "")).strip()
                        changed = connection.execute("UPDATE diary SET watched_on=?, rewatch=?, rating=?, review=? WHERE id=? AND tmdb_id=?", (watched_on, int(bool(payload.get("rewatch"))), rating, review, log_id, tmdb_id)).rowcount
                        if not changed: raise ValueError("Viewing log not found")
                    elif action == "delete_log":
                        changed = connection.execute("DELETE FROM diary WHERE id=? AND tmdb_id=?", (int(payload["id"]), tmdb_id)).rowcount
                        if not changed: raise ValueError("Viewing log not found")
                    elif action == "edit_comment":
                        body = str(payload.get("body", "")).strip()
                        if not body: raise ValueError("Write a comment first")
                        changed = connection.execute("UPDATE comments SET body=? WHERE id=? AND tmdb_id=?", (body, int(payload["id"]), tmdb_id)).rowcount
                        if not changed: raise ValueError("Comment not found")
                    elif action == "delete_comment":
                        changed = connection.execute("DELETE FROM comments WHERE id=? AND tmdb_id=?", (int(payload["id"]), tmdb_id)).rowcount
                        if not changed: raise ValueError("Comment not found")
                    else:
                        raise ValueError("Unknown activity")
                self.send_json(activity_record(tmdb_id))
            except (ValueError, TypeError) as error:
                self.send_json({"error": str(error)}, 400)
            return
        if self.path == "/api/import-letterboxd":
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 100 * 1024 * 1024:
                self.send_json({"error": "Choose a Letterboxd ZIP under 100 MB"}, 400)
                return
            payload = self.rfile.read(length)
            if not zipfile.is_zipfile(io.BytesIO(payload)):
                self.send_json({"error": "That is not a valid ZIP export"}, 400)
                return
            with import_lock:
                if import_job["state"] in {"queued", "running"}:
                    self.send_json({"error": "An import is already running"}, 409)
                    return
                import_job = {"state": "running", "progress": 1, "message": "Opening your Letterboxd export…", "imported": 0, "skipped": 0, "error": None}
            threading.Thread(target=import_letterboxd, args=(payload,), daemon=True).start()
            self.send_json({"ok": True}, 202)
            return
        if self.path == "/api/select-file":
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            chosen = filedialog.askopenfilename(
                title="Choose a movie",
                filetypes=[("Movie files", "*.mkv *.mp4 *.mov *.m4v *.avi"), ("All files", "*.*")],
            )
            root.destroy()
            if chosen:
                selected_file = Path(chosen)
            self.send_json({"file": probe(selected_file) if selected_file else None})
            return
        if self.path == "/api/generate":
            payload = self.read_json()
            path = Path(payload.get("path", ""))
            if not selected_file or path.resolve() != selected_file.resolve() or not path.is_file():
                self.send_json({"error": "Choose a valid movie file"}, 400)
                return
            with job_lock:
                if job["state"] == "running":
                    self.send_json({"error": "A Spectrum is already being created"}, 409)
                    return
                job = {"state": "queued", "progress": 1, "message": "Preparing the film…", "result": None, "error": None}
            threading.Thread(target=generate, args=(payload,), daemon=True).start()
            self.send_json({"ok": True}, 202)
            return
        if self.path == "/api/suggest-cuts":
            path = Path(self.read_json().get("path", ""))
            if not selected_file or path.resolve() != selected_file.resolve() or not path.is_file():
                self.send_json({"error": "Choose a valid movie file"}, 400)
                return
            try:
                self.send_json(suggest_boundaries(path))
            except Exception as error:
                self.send_json({"error": str(error)}, 500)
            return
        self.send_error(404)


def self_test() -> None:
    assert parse_timecode("01:52:26") == 6746
    assert format_timecode(6746) == "01:52:26"
    white = frame_color(bytes([255, 255, 255] * 4))
    assert white == (255, 255, 255)
    colors = ["#000000", "#ffffff"]
    first = permanent_id(1, "Theatrical", 0, 10, colors)
    assert first == permanent_id(1, "Theatrical", 0, 10, colors)
    assert first != permanent_id(2, "Theatrical", 0, 10, colors)
    assert valid_rating("4.5") == 4.5
    try:
        valid_rating("4.2")
        assert False, "invalid rating accepted"
    except ValueError:
        pass
    print("Absolute Spectrum self-test passed")


if __name__ == "__main__":
    import sys
    if "--self-test" in sys.argv:
        self_test()
        raise SystemExit
    initialize_db()
    OUTPUT.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    url = "http://127.0.0.1:8765"
    print(f"Absolute Spectrum is running at {url}")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
