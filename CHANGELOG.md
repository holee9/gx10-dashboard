# Changelog

All notable changes to GX10 Dashboard are documented in this file.

## [2.0.0] - 2026-02-03

### Added
- Alert system with configurable thresholds (CPU, GPU temp, Memory, Disk)
- Browser notifications for critical alerts
- Settings page for configuration
- Process monitoring (GPU processes, top CPU/memory)
- CPU core-by-core usage chart
- Detailed memory breakdown (buffers, cache, swap)
- Historical data persistence with IndexedDB (24 hours)
- Extended history charts (1min, 5min, 1hr, 24hr views)
- Data export (JSON/CSV)
- Prometheus metrics endpoint (/metrics)
- Tab navigation (Overview, Performance, Storage, Network)
- Dark/Light theme toggle
- Keyboard shortcuts
- Mobile responsive design
- ESLint and Vitest test suite (81 tests)
- OpenAPI documentation endpoint

### Changed
- Improved WebSocket reconnection logic
- Enhanced error handling
- Optimized bundle with code splitting

### Fixed
- Memory leak in metrics history
- WebSocket reconnection on network change

## [1.0.0] - 2026-01-15

### Added
- Initial release
- Real-time system monitoring
- GPU metrics via nvidia-smi
- Brain status (Code/Vision)
- Ollama integration
- WebSocket streaming (2-second updates)
