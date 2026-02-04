import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getCpuInfo, getMemoryInfo } from './services/system.js';
import { getGpuInfo } from './services/nvidia.js';
import { getBrainStatus } from './services/brain.js';
import { getOllamaRunningModels } from './services/ollama.js';
import { checkAlerts, AlertCheck } from './services/alerts.js';
import { getConfig } from './config.js';

interface MetricsData {
  timestamp: string;
  cpu: {
    usage: number;
    temperature: number | null;
  };
  memory: {
    used: number;
    percentage: number;
  };
  gpu: {
    utilization: number;
    memory_used: number | null;
    temperature: number;
    power_draw: number;
  } | null;
  brain: {
    active: string;
  };
  ollama: {
    models_loaded: string[];
  };
}

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    // Send initial data
    sendMetrics(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', error => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast metrics based on configured interval (default: 10 seconds)
  const config = getConfig();
  const updateInterval = config.server.updateInterval;
  console.log(`WebSocket update interval: ${updateInterval}ms`);

  const intervalId = setInterval(async () => {
    if (clients.size === 0) return;

    const metrics = await collectMetrics();
    const alerts: AlertCheck[] = checkAlerts(metrics);
    const message = JSON.stringify({ type: 'metrics', data: metrics, alerts });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, updateInterval);

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(intervalId);
  });

  return wss;
}

async function sendMetrics(ws: WebSocket): Promise<void> {
  try {
    const metrics = await collectMetrics();
    const alerts: AlertCheck[] = checkAlerts(metrics);
    ws.send(JSON.stringify({ type: 'metrics', data: metrics, alerts }));
  } catch (error) {
    console.error('Failed to send initial metrics:', error);
  }
}

async function collectMetrics(): Promise<MetricsData> {
  const [cpu, memory, gpu, brain, ollamaModels] = await Promise.all([
    getCpuInfo(),
    getMemoryInfo(),
    getGpuInfo(),
    getBrainStatus(),
    getOllamaRunningModels(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: cpu.usage,
      temperature: cpu.temperature,
    },
    memory: {
      used: memory.used,
      percentage: memory.percentage,
    },
    gpu: gpu
      ? {
          utilization: gpu.utilization,
          memory_used: gpu.memory_used,
          temperature: gpu.temperature,
          power_draw: gpu.power_draw,
        }
      : null,
    brain: {
      active: brain.active,
    },
    ollama: {
      models_loaded: ollamaModels.map(m => m.name),
    },
  };
}
