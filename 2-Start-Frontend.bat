@echo off
title GatePilot - Frontend Web App
color 0a
cd /d "%~dp0frontend"

echo ===================================================
echo   Starting GatePilot Frontend (Web Interface)
echo ===================================================
echo.
echo The app will open in your browser at:
echo http://localhost:8081
echo.
echo Press Ctrl+C anytime to stop.
echo ===================================================
echo.

call npm run web
pause
