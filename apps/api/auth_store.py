import asyncio
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database import get_db

SQLITE_PATH = Path(__file__).with_name("safeguard_auth.sqlite3")


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect_sqlite() -> sqlite3.Connection:
    connection = sqlite3.connect(SQLITE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    return connection


def _row_to_profile(row: sqlite3.Row | None) -> Optional[dict[str, Any]]:
    if row is None:
        return None
    profile = json.loads(row["payload"])
    profile["_id"] = profile.get("_id") or row["id"]
    profile["id"] = profile.get("id") or row["id"]
    profile["email"] = profile.get("email") or row["email"]
    profile["storage"] = "sqlite"
    return profile


def _sqlite_find_user_by_email(email: str) -> Optional[dict[str, Any]]:
    with _connect_sqlite() as connection:
        row = connection.execute(
            "SELECT * FROM profiles WHERE lower(email) = lower(?)",
            (email,),
        ).fetchone()
        return _row_to_profile(row)


def _sqlite_insert_user(profile: dict[str, Any]) -> dict[str, Any]:
    now = _utc_now()
    payload = {**profile, "storage": "sqlite", "created_at": now, "updated_at": now}
    with _connect_sqlite() as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO profiles (id, email, payload, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload["_id"],
                payload["email"],
                json.dumps(payload),
                now,
                now,
            ),
        )
    return payload


async def find_user_by_email(email: str) -> Optional[dict[str, Any]]:
    try:
        profile = await get_db().profiles.find_one({"email": email})
        if profile:
            profile["storage"] = "mongo"
            return profile
    except (PyMongoError, RuntimeError, ServerSelectionTimeoutError):
        pass

    return await asyncio.to_thread(_sqlite_find_user_by_email, email)


async def insert_user(profile: dict[str, Any]) -> dict[str, Any]:
    now = _utc_now()
    profile = {**profile, "created_at": now, "updated_at": now}

    try:
        await get_db().profiles.insert_one(profile)
        profile["storage"] = "mongo"
        await asyncio.to_thread(_sqlite_insert_user, profile)
        return profile
    except (PyMongoError, RuntimeError, ServerSelectionTimeoutError):
        return await asyncio.to_thread(_sqlite_insert_user, profile)
