"""Persistent active-symbol watchlist shared by the dashboard and MT5 bridge."""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path

AVAILABLE_SYMBOLS = (
    "USD/JPY", "EUR/USD", "GBP/USD", "AUD/USD", "USD/CHF",
    "EUR/JPY", "GBP/JPY", "USD/CAD", "NZD/USD", "AUD/JPY",
    "CAD/JPY", "XAU/USD", "BTC/USD", "DXY",
)
DEFAULT_ACTIVE_SYMBOLS = ("USD/JPY", "EUR/USD", "XAU/USD", "BTC/USD")
_SETTINGS_PATH = Path(__file__).resolve().parents[1] / "data" / "active_symbols.json"
_lock = threading.RLock()
_active_symbols: tuple[str, ...] | None = None


def _validated(symbols) -> tuple[str, ...]:
    if not isinstance(symbols, (list, tuple)):
        raise ValueError("active_symbols must be a list")
    requested = set(symbols)
    unknown = requested.difference(AVAILABLE_SYMBOLS)
    if unknown:
        raise ValueError(f"Unknown symbols: {', '.join(sorted(map(str, unknown)))}")
    if not requested:
        raise ValueError("At least one symbol must remain active")
    return tuple(symbol for symbol in AVAILABLE_SYMBOLS if symbol in requested)


def get_active_symbols() -> list[str]:
    global _active_symbols
    with _lock:
        if _active_symbols is None:
            try:
                payload = json.loads(_SETTINGS_PATH.read_text(encoding="utf-8"))
                _active_symbols = _validated(payload.get("active_symbols"))
            except FileNotFoundError:
                _active_symbols = DEFAULT_ACTIVE_SYMBOLS
            except (OSError, ValueError, TypeError, json.JSONDecodeError):
                # Corrupt settings must never activate every symbol. Restore safe defaults.
                _active_symbols = DEFAULT_ACTIVE_SYMBOLS
            return list(_active_symbols)
        return list(_active_symbols)


def set_active_symbols(symbols) -> list[str]:
    global _active_symbols
    validated = _validated(symbols)
    with _lock:
        _SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        temporary = _SETTINGS_PATH.with_suffix(".json.tmp")
        temporary.write_text(
            json.dumps({"active_symbols": list(validated)}, indent=2) + "\n",
            encoding="utf-8",
        )
        os.replace(temporary, _SETTINGS_PATH)
        _active_symbols = validated
        return list(_active_symbols)
