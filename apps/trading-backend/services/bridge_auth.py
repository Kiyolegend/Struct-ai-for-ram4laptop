"""Shared authentication for the local MT5 bridge and API."""

import os
import secrets
from pathlib import Path

from fastapi import Header, HTTPException

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
SECRET_NAME = "MT5_BRIDGE_SECRET"


def ensure_bridge_secret() -> str:
    """Create and persist one random bridge key if the local config lacks it."""
    secret = os.environ.get(SECRET_NAME, "").strip()
    if not secret:
        from dotenv import dotenv_values
        secret = str(dotenv_values(ENV_FILE).get(SECRET_NAME) or "").strip()
    if not secret:
        secret = secrets.token_urlsafe(32)

    try:
        lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
        replacement = f"{SECRET_NAME}={secret}"
        secret_lines = [line.strip() for line in lines if line.lstrip().startswith(f"{SECRET_NAME}=")]
        if secret_lines != [replacement]:
            found = False
            updated = []
            for line in lines:
                if line.lstrip().startswith(f"{SECRET_NAME}="):
                    if not found:
                        updated.append(replacement)
                        found = True
                    continue
                updated.append(line)
            if not found:
                updated.append(replacement)
            ENV_FILE.write_text("\n".join(updated) + "\n", encoding="utf-8")
    except OSError as exc:
        os.environ.pop(SECRET_NAME, None)
        print(f"WARNING: Could not save MT5 bridge secret to local .env: {exc}")
        return ""

    os.environ[SECRET_NAME] = secret
    return secret


def require_bridge_secret(
    x_mt5_secret: str = Header(default="", alias="X-MT5-Secret"),
) -> None:
    expected = os.environ.get(SECRET_NAME, "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="MT5 bridge authentication is not configured")
    if not x_mt5_secret or not secrets.compare_digest(x_mt5_secret, expected):
        raise HTTPException(status_code=401, detail="Invalid MT5 bridge secret")
