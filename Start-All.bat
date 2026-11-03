@echo off
title GatePilot - Master Launcher (With Local MongoDB)
color 0e

echo ===================================================
echo     GatePilot - Local MongoDB Master Launcher
echo ===================================================
echo.

:: 1. Check if MongoDB is already listening on port 27017
powershell -Command "$c = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue; if (!$c.TcpTestSucceeded) { exit 1 }" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [1/3] Local MongoDB is not running. Starting MongoDB server...
    start "MongoDB Database" "%~dp0Start-MongoDB.bat"
    timeout /t 4 /nobreak >nul
) else (
    echo [1/3] Local MongoDB is already running on port 27017.
)

:: 2. Launch Backend API (connected to local MongoDB)
echo [2/3] Starting Backend API Server...
start "GatePilot Backend" cmd /k "cd /d ""%~dp0backend"" && title GatePilot Backend && npm start"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: 3. Launch Frontend Web App
echo [3/3] Starting Frontend Web Interface...
start "GatePilot Frontend" cmd /k "cd /d ""%~dp0frontend"" && title GatePilot Frontend && npm run web"

echo.
echo ===================================================
echo  All services are up and connected to local MongoDB!
echo.
echo  • Web Application:  http://localhost:8081
echo  • Backend API:      http://localhost:5000
echo  • Database:         mongodb://127.0.0.1:27017/gatepilotDB
echo.
echo  View in MongoDB Compass:
echo    Connect to "mongodb://localhost:27017"
echo    and you will see "gatepilotDB"!
echo ===================================================
echo.
timeout /t 6
