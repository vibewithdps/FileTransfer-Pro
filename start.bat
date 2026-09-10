@echo off
title FileTransfer Pro v2
cd /d "%~dp0"
cls
echo ===================================================
echo   FileTransfer Pro v2 - Windows Launcher
echo ===================================================
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed!
  echo Please download and install Node.js from https://nodejs.org/
  pause
  exit /b
)
node server/server.js
pause