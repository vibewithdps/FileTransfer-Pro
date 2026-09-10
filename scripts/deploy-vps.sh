#!/bin/bash
# ==========================================================
# FileTransfer Pro v2 — Automated Ubuntu VPS Setup Script
# Run with: bash scripts/deploy-vps.sh
# ==========================================================

set -e

echo "🚀 Starting FileTransfer Pro v2 VPS Setup..."

# Update package lists
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y curl git ufw nginx

# Install Node.js 20 LTS (NodeSource)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

# Install PM2 process manager globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install --omit=dev

# Start app with PM2
echo "⚡ Starting app with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -n 1 | bash || true

# Setup Firewall
echo "🛡️ Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp
sudo ufw --force enable

echo "=========================================================="
echo "🎉 FileTransfer Pro is running on port 5000!"
echo "Check status anytime with: pm2 status"
echo "View live logs with:        pm2 logs filetransfer-pro"
echo "=========================================================="
