@echo off
title FileTransfer Pro v2
cd /d "%~dp0"
cls
echo Starting FileTransfer Pro v2...
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install from https://nodejs.org/
  pause
  exit /b
)
node server/server.js
pause
