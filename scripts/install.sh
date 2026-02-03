#!/bin/bash

# GX10 Dashboard Installation Script
# Usage: ./install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="gx10-dashboard"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          GX10 Dashboard Installation Script                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root for systemd setup
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Not running as root. Systemd service will not be installed."
    echo "   Run with sudo to install as a system service."
    INSTALL_SERVICE=false
else
    INSTALL_SERVICE=true
fi

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install Node.js 20 LTS or later."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18 or later."
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check npm
echo "🔍 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm $(npm -v) found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd "$PROJECT_DIR"

# Root dependencies
npm install

# Server dependencies
echo "📦 Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm install

# Client dependencies
echo "📦 Installing client dependencies..."
cd "$PROJECT_DIR/client"
npm install

# Build client
echo ""
echo "🔨 Building client..."
npm run build

# Build server
echo "🔨 Building server..."
cd "$PROJECT_DIR/server"
npm run build

echo ""
echo "✅ Build complete!"

# Install systemd service
if [ "$INSTALL_SERVICE" = true ]; then
    echo ""
    echo "🔧 Installing systemd service..."

    # Create service file
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=GX10 System Monitoring Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}/server
ExecStart=/usr/bin/node ${PROJECT_DIR}/server/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=9000

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    systemctl daemon-reload

    # Enable service
    systemctl enable "$SERVICE_NAME"

    echo "✅ Systemd service installed and enabled"
    echo ""
    echo "📝 Service commands:"
    echo "   Start:   sudo systemctl start ${SERVICE_NAME}"
    echo "   Stop:    sudo systemctl stop ${SERVICE_NAME}"
    echo "   Status:  sudo systemctl status ${SERVICE_NAME}"
    echo "   Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
fi

# Open firewall port (if ufw is available)
if command -v ufw &> /dev/null && [ "$INSTALL_SERVICE" = true ]; then
    echo ""
    echo "🔥 Configuring firewall..."
    ufw allow 9000/tcp comment "GX10 Dashboard" 2>/dev/null || true
    echo "✅ Port 9000 opened"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   Installation Complete!                      ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║  🌐 Dashboard URL:  http://localhost:9000                     ║"
echo "║  📡 API Base:       http://localhost:9000/api                 ║"
echo "║  🔌 WebSocket:      ws://localhost:9000/ws                    ║"
echo "║                                                               ║"
if [ "$INSTALL_SERVICE" = true ]; then
echo "║  Start the service:                                           ║"
echo "║    sudo systemctl start ${SERVICE_NAME}                       ║"
else
echo "║  Start manually:                                              ║"
echo "║    cd ${PROJECT_DIR} && npm start                             ║"
fi
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
