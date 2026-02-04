import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import statusRoutes from './routes/status.js';
import brainRoutes from './routes/brain.js';
import metricsRoutes from './routes/metrics.js';
import alertsRoutes from './routes/alerts.js';
import settingsRoutes from './routes/settings.js';
import docsRoutes from './routes/docs.js';
import prometheusRoutes from './routes/prometheus.js';
import { setupWebSocket } from './websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());

// Prometheus metrics endpoint (root level for standard scraping)
app.use('/metrics', prometheusRoutes);

// API Routes
app.use('/api/status', statusRoutes);
app.use('/api/brain', brainRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/ollama', metricsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/docs', docsRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve static files from client build in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) {
      // In development, client might not be built yet
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GX10 Dashboard</title>
            <style>
              body { font-family: system-ui; padding: 2rem; background: #1a1a2e; color: #eee; }
              h1 { color: #00d9ff; }
              code { background: #16213e; padding: 0.2rem 0.5rem; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>GX10 Dashboard API Server</h1>
            <p>The API server is running. To start the client:</p>
            <pre><code>cd client && npm install && npm run dev</code></pre>
            <p>Or build for production:</p>
            <pre><code>npm run build:client</code></pre>
            <h2>API Documentation</h2>
            <ul>
              <li><a href="/api/docs">/api/docs</a> - API documentation (JSON)</li>
              <li><a href="/api/docs/openapi">/api/docs/openapi</a> - OpenAPI 3.0 specification</li>
            </ul>
            <h2>API Endpoints</h2>
            <ul>
              <li><a href="/api/health">/api/health</a> - Health check</li>
              <li><a href="/api/status">/api/status</a> - Full system status</li>
              <li><a href="/api/brain">/api/brain</a> - Brain status</li>
              <li><a href="/api/metrics">/api/metrics</a> - Quick metrics</li>
              <li><a href="/api/ollama">/api/ollama</a> - Ollama status</li>
              <li><a href="/api/alerts/thresholds">/api/alerts/thresholds</a> - Alert thresholds</li>
              <li><a href="/api/settings">/api/settings</a> - Dashboard settings</li>
            </ul>
          </body>
        </html>
      `);
    }
  });
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   GX10 Dashboard Server                       ║
╠═══════════════════════════════════════════════════════════════╣
║  🌐 HTTP Server:  http://localhost:${PORT}                      ║
║  🔌 WebSocket:    ws://localhost:${PORT}/ws                     ║
║  📡 API Base:     http://localhost:${PORT}/api                  ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
