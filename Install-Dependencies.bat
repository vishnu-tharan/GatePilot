@echo off
title GatePilot - Install Dependencies
color 0f

echo ===================================================
echo     GatePilot - Dependency Installer
echo ===================================================
echo.

echo [1/2] Installing backend packages...
cd /d "%~dp0backend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo Backend installation encountered an error.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Installing frontend packages...
cd /d "%~dp0frontend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo Frontend installation encountered an error.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo  All dependencies installed successfully!
echo  You can now double-click "Start-All.bat" to run.
echo ===================================================
echo.
pause
