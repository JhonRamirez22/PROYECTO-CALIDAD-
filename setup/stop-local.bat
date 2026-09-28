@echo off
title RiTech Export - Stop Services
echo.
echo Stopping RiTech services...

:: Kill processes on ports 3000 and 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo Done! Services stopped.
echo.
pause
