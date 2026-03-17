#!/bin/bash
# Run this whenever you update code or .env
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Building frontend..."
cd "$PROJECT_DIR" && npm run build

echo "▶ Restarting service..."
sudo systemctl restart resumecraft

echo "✅ Deployed! http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null):3000"
