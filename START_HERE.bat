@echo off
echo ============================================================
echo   STRUCT.ai - Quick Start
echo ============================================================
echo.
echo Recommended: double-click STRUCT-AI.bat for the full setup and launch.
echo.
echo Manual startup:
echo   1. Make sure MetaTrader 5 is open and logged in.
echo   2. Double-click start_api.bat and wait for the API to start.
echo   3. Double-click start_bridge.bat.
echo   4. From this folder, run:
echo      pnpm --filter @workspace/trading-dashboard run build
echo      pnpm --filter @workspace/trading-dashboard run serve
echo.
echo Dashboard: http://localhost:5173
echo API:       http://localhost:8001
echo.
pause