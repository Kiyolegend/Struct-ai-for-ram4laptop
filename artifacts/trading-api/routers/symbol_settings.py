"""Dashboard and bridge endpoints for the persisted active-symbol list."""

import os

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from services.symbol_settings import AVAILABLE_SYMBOLS, get_active_symbols, set_active_symbols

router = APIRouter()


class ActiveSymbolsPayload(BaseModel):
    active_symbols: list[str]


@router.get("/symbols/settings")
async def read_symbol_settings():
    return {
        "active_symbols": get_active_symbols(),
        "available_symbols": list(AVAILABLE_SYMBOLS),
    }


@router.put("/symbols/settings")
async def write_symbol_settings(payload: ActiveSymbolsPayload):
    try:
        active = set_active_symbols(payload.active_symbols)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"active_symbols": active, "available_symbols": list(AVAILABLE_SYMBOLS)}


@router.get("/mt5/active-symbols")
async def bridge_active_symbols(x_mt5_secret: str = Header(default="")):
    """Read-only bridge endpoint; follows the existing MT5 endpoint secret policy."""
    expected_secret = os.environ.get("MT5_BRIDGE_SECRET", "")
    if expected_secret and x_mt5_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid MT5 bridge secret")
    return {"active_symbols": get_active_symbols()}
