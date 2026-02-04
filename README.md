# GX10 System Monitoring Dashboard

GX10 시스템의 상태를 웹에서 실시간으로 모니터링할 수 있는 대시보드입니다.

![Dashboard Preview]((http://100.78.1.7:9000/))

## v2.0 New Features

### Alert System
- **Configurable Thresholds**: CPU, GPU temperature, Memory, Disk usage alerts
- **Browser Notifications**: Real-time alerts for critical system events
- **Alert History**: Track and review past alerts

### Settings Page
- Alert threshold configuration
- Theme preferences (Dark/Light)
- Notification settings
- Export configuration

### Process Monitoring
- GPU process list with memory usage
- Top CPU/Memory consuming processes
- Real-time process metrics

### Historical Data
- **IndexedDB Persistence**: 24 hours of data retention
- **Extended History Charts**: 1min, 5min, 1hr, 24hr views
- **Data Export**: JSON/CSV export functionality

### Prometheus Metrics
- `/metrics` endpoint for Prometheus scraping
- Standard metric format for monitoring integration
- Custom labels for GX10-specific metrics

### Tab Navigation
- **Overview**: System summary with all key metrics
- **Performance**: Detailed CPU cores and memory breakdown
- **Storage**: Disk usage and memory details
- **Network**: Network interface statistics

### Theme Support
- Dark mode (default)
- Light mode
- System preference detection
- Persistent theme selection

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Overview tab |
| `2` | Performance tab |
| `3` | Storage tab |
| `4` | Network tab |
| `R` | Refresh data |
| `A` | Toggle advanced view |
| `S` | Open settings |
| `T` | Toggle theme |
| `?` | Show shortcuts help |

## Architecture

```
+------------------------------------------------------------------+
|                    Web Browser                                    |
|    http://gx10:9000                                               |
|  +--------------------------------------------------------------+ |
|  |              React Dashboard (SPA)                           | |
|  |  - CPU/Memory monitoring     - GPU status                    | |
|  |  - Brain mode switch         - Ollama models                 | |
|  |  - Alert system              - Process list                  | |
|  |  - Historical charts         - Settings                      | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
                              |
                              | HTTP/WebSocket
                              v
+------------------------------------------------------------------+
|                 GX10 Server (:9000)                               |
|  +--------------------------------------------------------------+ |
|  |              Express.js API Server                           | |
|  |  - GET  /api/status       - Full system status               | |
|  |  - GET  /api/brain        - Brain status                     | |
|  |  - POST /api/brain/switch - Brain switch                     | |
|  |  - GET  /api/metrics      - Real-time metrics                | |
|  |  - GET  /api/processes    - Process list                     | |
|  |  - GET  /metrics          - Prometheus metrics               | |
|  |  - GET  /api/docs         - OpenAPI documentation            | |
|  |  - WS   /ws               - WebSocket updates                | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

## Requirements

- Node.js 20 LTS or higher
- npm 10 or higher
- NVIDIA GPU (nvidia-smi required, optional)
- GX10 Brain scripts (optional)
- Ollama (optional)

## Installation

### Automated Installation

```bash
cd ~/workspace/gx10-dashboard
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

### Manual Installation

```bash
# Install dependencies
npm run install:all

# Build client
cd client && npm run build && cd ..

# Build server
cd server && npm run build && cd ..

# Start server
npm start
```

## Development Mode

```bash
# Run server and client simultaneously
npm run dev

# Or run individually
cd server && npm run dev  # Backend (port 9000)
cd client && npm run dev  # Frontend (port 5173, proxy configured)
```

## Testing

```bash
# Run client tests
cd client && npm run test:run

# Run server tests
cd server && npm run test:run

# Run tests with coverage
cd client && npm run test:coverage
cd server && npm run test:coverage
```

## Build

```bash
# Full build
npm run build

# Server only
cd server && npm run build

# Client only
cd client && npm run build
```

## Service Management

For systemd service:

```bash
# Start service
sudo systemctl start gx10-dashboard

# Stop service
sudo systemctl stop gx10-dashboard

# Check status
sudo systemctl status gx10-dashboard

# View logs
sudo journalctl -u gx10-dashboard -f
```

## API Endpoints

### System Status

```bash
# Full status
curl http://localhost:9000/api/status

# GPU information
curl http://localhost:9000/api/status/gpu

# Quick metrics
curl http://localhost:9000/api/metrics

# Process list
curl http://localhost:9000/api/processes
```

### Brain Control

```bash
# Current status
curl http://localhost:9000/api/brain

# Switch Brain
curl -X POST http://localhost:9000/api/brain/switch \
  -H "Content-Type: application/json" \
  -d '{"target": "vision"}'

# Switch history
curl http://localhost:9000/api/brain/history
```

### Ollama

```bash
# Ollama status
curl http://localhost:9000/api/ollama

# Installed models
curl http://localhost:9000/api/ollama/models

# Running models
curl http://localhost:9000/api/ollama/ps
```

### Monitoring

```bash
# Prometheus metrics
curl http://localhost:9000/metrics

# Health check
curl http://localhost:9000/api/health

# OpenAPI documentation
curl http://localhost:9000/api/docs
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `9000` | Server port |
| `OLLAMA_API_URL` | `http://localhost:11434` | Ollama API URL |

### GX10 Script Paths

Brain features integrate with these scripts:

- `/gx10/api/status.sh` - System status
- `/gx10/api/switch.sh` - Brain switch
- `/gx10/runtime/active_brain.json` - Brain status file

Dashboard works without these scripts, but Brain switch functionality will be limited.

## Tech Stack

### Backend
- Node.js 20 LTS
- Express.js 4.x
- TypeScript 5.x
- ws (WebSocket)

### Frontend
- React 18
- Vite 6
- TypeScript 5.x
- Tailwind CSS 3
- Recharts (charts)
- Zustand (state management)

### Testing
- Vitest
- Testing Library (React)
- Supertest (API)

## Project Structure

```
gx10-dashboard/
+-- server/                  # Backend
|   +-- src/
|   |   +-- index.ts         # Server entry point
|   |   +-- routes/          # API routes
|   |   |   +-- status.ts    # System status
|   |   |   +-- brain.ts     # Brain control
|   |   |   +-- metrics.ts   # Metrics API
|   |   |   +-- processes.ts # Process list
|   |   +-- services/        # Business logic
|   |   |   +-- system.ts    # CPU/Memory
|   |   |   +-- nvidia.ts    # GPU
|   |   |   +-- brain.ts     # Brain
|   |   |   +-- ollama.ts    # Ollama
|   |   |   +-- prometheus.ts# Prometheus metrics
|   |   +-- websocket.ts     # WebSocket
|   +-- package.json
+-- client/                  # Frontend
|   +-- src/
|   |   +-- App.tsx
|   |   +-- components/      # React components
|   |   |   +-- Dashboard.tsx
|   |   |   +-- AlertPanel.tsx
|   |   |   +-- SettingsPage.tsx
|   |   |   +-- HistoryChart.tsx
|   |   |   +-- ProcessList.tsx
|   |   |   +-- CpuCoreChart.tsx
|   |   |   +-- MemoryDetailCard.tsx
|   |   |   +-- ExportButton.tsx
|   |   |   +-- ThemeToggle.tsx
|   |   +-- hooks/           # Custom hooks
|   |   +-- store/           # Zustand store
|   |   +-- styles/          # CSS
|   +-- package.json
+-- scripts/
|   +-- install.sh           # Install script
+-- package.json
+-- CHANGELOG.md
+-- README.md
```

## Screenshots

### Overview Tab
![Overview](docs/screenshots/overview.png)

### Performance Tab
![Performance](docs/screenshots/performance.png)

### Settings Page
![Settings](docs/screenshots/settings.png)

### Alert Panel
![Alerts](docs/screenshots/alerts.png)

## Troubleshooting

### External Access Blocked (ERR_CONNECTION_TIMED_OUT)

Port 9000 may be blocked by firewall.

```bash
# Open port 9000
sudo iptables -I INPUT -p tcp --dport 9000 -j ACCEPT

# Or with ufw
sudo ufw allow 9000/tcp
```

### Access URLs

| Location | URL |
|----------|-----|
| GX10 server | http://localhost:9000 |
| Same network PC | http://[GX10_IP]:9000 |
| Via Tailscale | http://[Tailscale_IP]:9000 |

```bash
# Check GX10 IP
hostname -I | awk '{print $1}'

# Check Tailscale IP
tailscale ip -4
```

### GPU VRAM Shows N/A

Some NVIDIA GPUs (e.g., GB10) don't support memory queries via `nvidia-smi`.
In this case, VRAM fields display "N/A", which is normal behavior.

```bash
# Check memory query support
nvidia-smi --query-gpu=memory.total --format=csv,noheader
# [N/A] output means memory query is not supported
```

### TypeScript Build Errors

#### import.meta Error

```
error TS1470: The 'import.meta' meta-property is not allowed in files which will build into CommonJS output.
```

**Solution**: Add ESM module setting to `server/package.json`

```json
{
  "type": "module"
}
```

#### module/moduleResolution Mismatch

```
error TS5110: Option 'module' must be set to 'NodeNext' when option 'moduleResolution' is set to 'NodeNext'.
```

**Solution**: Match module and moduleResolution in `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### Server Already Running

```bash
# Find process using port 9000
lsof -ti:9000

# Kill the process
lsof -ti:9000 | xargs kill -9
```

## Development Notes

### Known Limitations

1. **GPU Memory**: Some NVIDIA GPUs (e.g., GB10) don't support memory queries
2. **CPU Temperature**: Returns null on systems without `sensors` command
3. **Brain Scripts**: Uses defaults if `/gx10/api/` scripts are not found

### Performance Optimization

- React.memo for expensive components
- Code splitting (vendor, charts, store)
- IndexedDB for historical data persistence
- WebSocket for real-time updates (avoids polling)

## License

MIT License

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
