@echo off
title GatePilot - Push Fresh Project to GitHub
color 0a

echo ===================================================
echo   Pushing Fresh Project to GitHub (Force Overwrite)
echo   Target: https://github.com/vishnu-tharan/GatePilot
echo ===================================================
echo.
echo This will completely replace the GitHub repository
echo with this fresh, clean version.
echo.

git push --force -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS!
    echo   GitHub repository has been completely replaced:
    echo   https://github.com/vishnu-tharan/GatePilot
    echo ===================================================
) else (
    echo.
    echo [ERROR] Push failed.
    echo Please make sure you are signed into GitHub.
)

echo.
pause
