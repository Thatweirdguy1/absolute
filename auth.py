"""Email registration for the future hosted version of Absolute."""

import hashlib
import re
import secrets
import smtplib
import sqlite3
import ssl
import time
from contextlib import closing
from email.message import EmailMessage
from urllib.parse import quote

from argon2 import PasswordHasher


PASSWORD_HASHER = PasswordHasher()
USERNAME = re.compile(r"[A-Za-z0-9_]{3,30}\Z")
EMAIL = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+\Z")


class RegistrationError(ValueError):
    pass


def initialize_auth(connection):
    connection.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        username TEXT NOT NULL COLLATE NOCASE UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        verified_at INTEGER,
        created_at INTEGER NOT NULL
    )""")
    connection.execute("""CREATE TABLE IF NOT EXISTS email_verifications (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL
    )""")
    connection.execute("""CREATE TABLE IF NOT EXISTS registration_attempts (
        key_hash TEXT NOT NULL,
        attempted_at INTEGER NOT NULL
    )""")
    connection.execute("CREATE INDEX IF NOT EXISTS registration_attempts_lookup ON registration_attempts(key_hash, attempted_at)")


def registration_fields(payload):
    if not isinstance(payload, dict):
        raise RegistrationError("Invalid registration request")
    email = str(payload.get("email", "")).strip().casefold()
    username = str(payload.get("username", "")).strip()
    display_name = str(payload.get("display_name", "")).strip()
    password = payload.get("password", "")
    if len(email) > 254 or not EMAIL.fullmatch(email):
        raise RegistrationError("Enter a valid email address")
    if not USERNAME.fullmatch(username):
        raise RegistrationError("Username must be 3–30 letters, numbers, or underscores")
    if not display_name or len(display_name) > 80 or any(ord(c) < 32 for c in display_name):
        raise RegistrationError("Display name must be 1–80 characters")
    if not isinstance(password, str) or not 12 <= len(password) <= 1024:
        raise RegistrationError("Use a password of at least 12 characters")
    return email, username, display_name, password


def smtp_ready(settings):
    return all(settings.get(key) for key in ("SMTP_HOST", "SMTP_FROM", "SMTP_USER", "SMTP_PASSWORD", "ABSOLUTE_BASE_URL"))


def send_verification(settings, email, token):
    base_url = settings["ABSOLUTE_BASE_URL"].rstrip("/")
    if not base_url.startswith(("https://", "http://127.0.0.1:", "http://localhost:")):
        raise RegistrationError("Set an HTTPS Absolute base URL before enabling registration")
    message = EmailMessage()
    message["From"] = settings["SMTP_FROM"]
    message["To"] = email
    message["Subject"] = "Verify your Absolute email"
    message.set_content(f"To verify your Absolute account, open:\n\n{base_url}/verify-email#token={quote(token)}\n\nThis link expires in one hour. If you did not register, ignore this email.\n")
    with smtplib.SMTP_SSL(settings["SMTP_HOST"], int(settings.get("SMTP_PORT", "465")), context=ssl.create_default_context(), timeout=15) as smtp:
        smtp.login(settings["SMTP_USER"], settings["SMTP_PASSWORD"])
        smtp.send_message(message)


def register(db_path, payload, client_ip, settings):
    now = int(time.time())
    key_hash = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()
    with closing(sqlite3.connect(db_path, timeout=10)) as connection, connection:
        connection.execute("BEGIN IMMEDIATE")
        connection.execute("DELETE FROM registration_attempts WHERE attempted_at < ?", (now - 86400,))
        count = connection.execute("SELECT COUNT(*) FROM registration_attempts WHERE key_hash=? AND attempted_at>?", (key_hash, now - 3600)).fetchone()[0]
        if count >= 5:
            raise RegistrationError("Too many registrations. Try again in an hour")
        connection.execute("INSERT INTO registration_attempts VALUES (?, ?)", (key_hash, now))
    if not smtp_ready(settings):
        raise RegistrationError("Email registration is not configured yet")
    email, username, display_name, password = registration_fields(payload)
    token = secrets.token_urlsafe(32)
    with closing(sqlite3.connect(db_path, timeout=10)) as connection, connection:
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("BEGIN IMMEDIATE")
        if connection.execute("SELECT 1 FROM users WHERE email=? OR username=?", (email, username)).fetchone():
            raise RegistrationError("Email or username is unavailable")
        user_id = connection.execute("INSERT INTO users(email, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (email, username, display_name, PASSWORD_HASHER.hash(password), now)).lastrowid
        connection.execute("INSERT INTO email_verifications VALUES (?, ?, ?)",
            (user_id, hashlib.sha256(token.encode("ascii")).hexdigest(), now + 3600))
        try:
            send_verification(settings, email, token)
        except (OSError, smtplib.SMTPException) as error:
            raise RegistrationError("Could not send verification email. Try again later") from error
    return {"ok": True, "message": "Check your email for a verification link."}


def verify_email(db_path, token):
    if not isinstance(token, str) or not 32 <= len(token) <= 128:
        raise RegistrationError("Invalid verification link")
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with closing(sqlite3.connect(db_path, timeout=10)) as connection, connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute("SELECT user_id FROM email_verifications WHERE token_hash=? AND expires_at>?", (digest, int(time.time()))).fetchone()
        if not row:
            raise RegistrationError("This verification link is invalid or expired")
        connection.execute("UPDATE users SET verified_at=? WHERE id=?", (int(time.time()), row[0]))
        connection.execute("DELETE FROM email_verifications WHERE user_id=?", (row[0],))
    return {"ok": True, "message": "Email verified. Sign-in is coming next."}
