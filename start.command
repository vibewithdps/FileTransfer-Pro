#!/bin/bash
# ==========================================================
# FileTransfer Pro v2 — macOS Startup Launcher
# ==========================================================
cd "$(dirname "$0")"
clear
echo "🚀 Starting FileTransfer Pro v2 on macOS..."
node server/server.js
