@echo off
title GatePilot - Backend API (Local MongoDB)
color 0b
cd /d "%~dp0backend"

echo ===================================================
echo   Starting GatePilot Backend Server
echo ===================================================
echo.
echo Connecting to local MongoDB: mongodb://127.0.0.1:27017/gatepilotDB
echo.
echo Make sure MongoDB is running (run Start-MongoDB.bat or start MongoDB service).
echo Open MongoDB Compass to view live data in "gatepilotDB".
echo.
echo Press Ctrl+C anytime to stop.
echo ===================================================
echo.

call npm start
if %ERRORLEVEL% neq 0 (
    echo.
    echo [NOTICE] If the connection failed because MongoDB was not running,
    echo run "Start-MongoDB.bat" first, then restart this backend.
    echo.
    pause
)
