@echo off
title RiTech Export - Setup & Run
echo.
echo ====================================
echo   RiTech Export - Setup ^& Run
echo ====================================
echo.
echo   This will:
echo   1. Verify local Node/npm configuration
echo   2. Create schema and synthetic development data
echo   3. Start API + Frontend
echo.

:: Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   [!] Need Administrator rights.
    echo       Right-click ^> Run as administrator
    echo.
    pause
    exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0setup-and-run.ps1"
pause
