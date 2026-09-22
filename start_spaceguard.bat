@echo off
TITLE SpaceGuard Telemetry Platform - Launcher
COLOR 0A

echo ============================================================
echo               SPACEGUARD TELEMETRY PLATFORM
echo        NASA DONKI Engine + React Telemetry Dashboard
echo ============================================================
echo.

REM 1. Ensure database directory exists
if not exist "database" (
    echo [INFO] Creating SQLite database directory...
    mkdir database
)

echo [1/2] Starting Scala Data Engineering Engine (spaceguard.jar)...
start "SpaceGuard Scala Engine" cmd /k "java --enable-native-access=ALL-UNNAMED -jar scala/spaceguard.jar 2026-08-01 2026-08-30"

echo.
echo [2/2] Starting React Vite Frontend Telemetry Dashboard...
echo.
echo Launching React application on http://localhost:3000 ...
echo.

npm run dev

pause
