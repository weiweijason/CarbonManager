# backend/helpers.py

import json
from datetime import datetime
from zoneinfo import ZoneInfo
from flask import Response

PREFIXES = {
    "users": "USR",
    "product_types": "PRT",
    "products": "PRD",
    "emissions": "EMS",
    "stages": "STG",
    "steps": "STP",
    "tags": "TAG",
    "organizations": "ORG",
}

TAIPEI_TZ = ZoneInfo("Asia/Taipei")

def display_id(table: str, numeric_id: int) -> str:
    return f"{PREFIXES[table]}{numeric_id}"

def parse_display_id(value: str, expected_prefix: str) -> int:
    if not value.startswith(expected_prefix):
        raise ValueError(f"Invalid ID prefix: expected {expected_prefix}")

    suffix = value[len(expected_prefix):]
    if not suffix.isdigit():
        raise ValueError("Display ID must end with digits")

    return int(suffix)


def parse_display_id_safe(value: str, expected_prefix: str) -> tuple[int | None, str | None]:
    """Safely parse prefixed display IDs without raising exceptions."""
    if not value:
        return None, "missing ID value"
    try:
        return parse_display_id(value, expected_prefix), None
    except ValueError as exc:
        return None, str(exc)


def to_taipei_iso(dt: datetime | None) -> str | None:
    """Convert datetime to ISO-8601 in Asia/Taipei timezone."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TAIPEI_TZ)
    else:
        dt = dt.astimezone(TAIPEI_TZ)
    return dt.isoformat(timespec="seconds")


def json_response(data, status=200):
    """
    Returns a JSON response with preserved key order.
    This bypasses Flask's jsonify() so keys will NOT be re-sorted.
    """
    body = json.dumps(
        data,
        ensure_ascii=False,
        sort_keys=False,   # Make sure the response is sorted as desired
    )
    return Response(body, mimetype="application/json", status=status)


# Validators
def _is_shop(claims: dict) -> bool:
    return (claims.get("user_type") or "").lower() == "shop"


def _validate_name(name: str) -> str | None:
    if not name:
        return "name is required"
    if len(name) > 100:
        return "name must be at most 100 characters"
    return None
