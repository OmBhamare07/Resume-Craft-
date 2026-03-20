#!/bin/bash
# Run this ONCE on your EC2 after uploading the project
# It installs deps, builds frontend, sets up backend, and auto-starts on reboot

set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
NODE=$(which node)
NPM=$(which npm)
USER_NAME=$(whoami)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ResumeCraft Full Setup"
echo "  Project: $PROJECT_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


# Install Chromium for PDF generation
echo ""
echo "▶ Installing Chromium for PDF generation..."
sudo yum install -y chromium 2>/dev/null || \
sudo apt-get install -y chromium-browser 2>/dev/null || \
sudo apt-get install -y chromium 2>/dev/null || \
echo "  ⚠️  Chromium install failed — try manually: sudo apt-get install -y chromium-browser"

# 1. Create DynamoDB tables
echo ""
echo "▶ Creating DynamoDB tables..."
bash "$BACKEND_DIR/setup-dynamodb.sh" || echo "  (Tables may already exist — continuing)"

# 2. Install frontend deps + build
echo ""
echo "▶ Installing frontend dependencies..."
cd "$PROJECT_DIR" && $NPM install

echo ""
echo "▶ Building frontend..."
$NPM run build

# 3. Install backend deps
echo ""
echo "▶ Installing backend dependencies..."
cd "$BACKEND_DIR" && $NPM install

# 4. Check backend .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo ""
  echo "  ⚠️  No backend/.env found — copying from example..."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "  Edit $BACKEND_DIR/.env with your real values before starting!"
fi

# 5. Create systemd service — runs the Express backend on port 3000
#    (backend serves both API + built frontend static files)
echo ""
echo "▶ Creating systemd service..."
sudo tee /etc/systemd/system/resumecraft.service > /dev/null << UNIT
[Unit]
Description=ResumeCraft App (Express + Vite)
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$BACKEND_DIR
ExecStart=$NODE $BACKEND_DIR/server.js
Restart=always
RestartSec=5
EnvironmentFile=$BACKEND_DIR/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# 6. Enable + start
echo ""
echo "▶ Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable resumecraft
sudo systemctl restart resumecraft

# 7. Open firewall
if command -v ufw &>/dev/null && sudo ufw status | grep -q "active"; then
  sudo ufw allow 3000
fi

sleep 2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if sudo systemctl is-active --quiet resumecraft; then
  EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_IP")
  echo "  ✅ ResumeCraft is LIVE!"
  echo ""
  echo "  🌐  http://${EC2_IP}:3000"
  echo ""
  echo "  Next steps:"
  echo "  1. Edit backend/.env with your real JWT_SECRET, Gmail, Google OAuth values"
  echo "  2. sudo systemctl restart resumecraft"
  echo ""
  echo "  Useful commands:"
  echo "    sudo systemctl status resumecraft"
  echo "    sudo systemctl restart resumecraft"
  echo "    sudo journalctl -u resumecraft -f"
else
  echo "  ❌ Service failed. Check: sudo journalctl -u resumecraft -n 50"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
