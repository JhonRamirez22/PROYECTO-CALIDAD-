@echo off
title RiTech Export - Local Setup
echo.
echo ====================================
echo   RiTech Export System - Local Setup
echo   PostgreSQL 16 + pgAdmin 4 (install separately)
echo ====================================
echo.
echo This will prepare local environment files and synthetic seed data.
echo PostgreSQL 16 and pgAdmin 4 must already be installed and configured.
echo.
echo You need Administrator rights.
echo.

:: Check admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Not running as Administrator.
    echo     Right-click this file ^> Run as administrator
    echo.
    pause
    exit /b 1
)

:: Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0setup-local.ps1"

echo.
pause
