@echo off
title RiTech Export - Local Development
cd /d "%~dp0\.."

echo.
echo ====================================
echo   RiTech Export System
echo   Starting local development...
echo ====================================
echo.
echo   API:  http://localhost:3001
echo   Web:  http://localhost:3000
echo.
echo   Press Ctrl+C to stop both.
echo.

:: Kill previous instances
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: Start API in background
echo [1/2] Starting API on port 3001...
start "RiTech API" cmd /c "cd /d "%~dp0\..\apps\api" && npm run start:dev"

:: Wait for API to initialize
timeout /t 5 /nobreak >nul

:: Start Frontend in background
echo [2/2] Starting Frontend on port 3000...
start "RiTech Web" cmd /c "cd /d "%~dp0\..\apps\web" && set NEXT_PUBLIC_API_URL=http://localhost:3001 && npm run dev"

echo.
echo Both services started!
echo   API window: "RiTech API"
echo   Web window: "RiTech Web"
echo.
echo Close this window or press any key to keep running.
pause >nul
