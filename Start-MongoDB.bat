@echo off
title MongoDB Server (Port 27017)
color 0b

echo ===================================================
echo   Starting Local MongoDB Server on Port 27017
echo ===================================================
echo.
echo Database Directory: "%~dp0data\db"
echo Connection URI:     mongodb://127.0.0.1:27017
echo.

if not exist "%~dp0data\db" mkdir "%~dp0data\db"

if exist "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" (
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "%~dp0data\db" --port 27017 --bind_ip 127.0.0.1
) else (
    echo [ERROR] MongoDB 8.0 executable not found at:
    echo "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
    pause
)
