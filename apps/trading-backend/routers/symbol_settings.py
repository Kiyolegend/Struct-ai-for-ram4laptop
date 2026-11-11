"""Dashboard and bridge endpoints for the persisted active-symbol list."""


from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.symbol_settings import AVAILABLE_SYMBOLS, get_active_symbols, set_active_symbols
from services.bridge_auth import require_bridge_secret

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


@router.get("/mt5/active-symbols", dependencies=[Depends(require_bridge_secret)])
async def bridge_active_symbols():
    """Read-only endpoint for the authenticated MT5 bridge."""
    return {"active_symbols": get_active_symbols()}
