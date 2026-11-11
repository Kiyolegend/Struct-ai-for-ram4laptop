"""
MT5 Bridge router.

POST /trading-api/mt5/push   — Windows bridge pushes OHLC data here
GET  /trading-api/mt5/status — Dashboard checks if MT5 is online
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import pandas as pd
import time
import asyncio
from ws_manager import broadcast
from services.symbol_specs_store import store_specs, get_specs
from services.bridge_auth import require_bridge_secret


from services.mt5_store import store_candles, status as mt5_status, get_latest_timestamp, VALID_INTERVALS
_bg_tasks: set = set()

router = APIRouter()

class OHLCCandle(BaseModel):
    time: int        # Unix timestamp (seconds)
    open: float
    high: float
    low: float
    close: float


class MT5PushPayload(BaseModel):
    symbol: str      # e.g. "USD/JPY"
    interval: str    # Includes "1m"; accepted values are defined by VALID_INTERVALS
    candles: list[OHLCCandle]

class SymbolSpecsPayload(BaseModel):
    symbol: str
    contract_size: float
    tick_value: float
    tick_size: float

@router.post("/mt5/push", dependencies=[Depends(require_bridge_secret)])
async def mt5_push(payload: MT5PushPayload):
    if payload.interval not in VALID_INTERVALS:
        raise HTTPException(
            status_code=400,
            detail=f"interval must be one of {sorted(VALID_INTERVALS)}"
        )

    if len(payload.candles) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 candles")

    rows = [
        {
            "time": pd.Timestamp(c.time, unit="s", tz="UTC").tz_localize(None),
            "open": c.open,
            "high": c.high,
            "low": c.low,
            "close": c.close,
        }
        for c in payload.candles
    ]
    df = pd.DataFrame(rows)
    df = df.sort_values("time").reset_index(drop=True)

    store_candles(payload.symbol, payload.interval, df)
    
    _task = asyncio.create_task(broadcast({"type": "candle", "symbol": payload.symbol, "interval": payload.interval}))
    _bg_tasks.add(_task)
    _task.add_done_callback(_bg_tasks.discard)

    return {
        "ok": True,
        "symbol": payload.symbol,
        "interval": payload.interval,
        "candles_received": len(df),
        "latest_candle": payload.candles[-1].time,
    }


@router.get("/mt5/status")
async def mt5_status_endpoint():
    return mt5_status()



@router.get("/mt5/server-time")
async def mt5_server_time():
    """Returns last broker candle timestamp. Frontend uses this instead of Date.now()."""
    ts = get_latest_timestamp()
    return {"broker_time": ts if ts is not None else int(time.time())}

@router.post("/mt5/push-specs", dependencies=[Depends(require_bridge_secret)])
async def mt5_push_specs(payload: SymbolSpecsPayload):
    store_specs(payload.symbol, payload.contract_size, payload.tick_value, payload.tick_size)
    return {"ok": True, "symbol": payload.symbol}


@router.get("/mt5/specs")
async def mt5_get_specs(symbol: str):
    specs = get_specs(symbol)
    if specs is None:
        raise HTTPException(status_code=404, detail=f"No specs yet for {symbol}")
    return specs