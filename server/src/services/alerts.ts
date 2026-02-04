export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  gpu_temp: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
}

export interface AlertCheck {
  type: 'cpu' | 'gpu_temp' | 'memory' | 'disk';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
}

export interface MetricsData {
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

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  cpu: { warning: 80, critical: 90 },
  gpu_temp: { warning: 75, critical: 85 },
  memory: { warning: 80, critical: 90 },
  disk: { warning: 85, critical: 95 },
};

// Current thresholds (can be updated at runtime)
let currentThresholds: AlertThresholds = { ...DEFAULT_THRESHOLDS };

export function getThresholds(): AlertThresholds {
  return { ...currentThresholds };
}

export function setThresholds(thresholds: Partial<AlertThresholds>): AlertThresholds {
  currentThresholds = {
    cpu: thresholds.cpu ?? currentThresholds.cpu,
    gpu_temp: thresholds.gpu_temp ?? currentThresholds.gpu_temp,
    memory: thresholds.memory ?? currentThresholds.memory,
    disk: thresholds.disk ?? currentThresholds.disk,
  };
  return { ...currentThresholds };
}

export function resetThresholds(): AlertThresholds {
  currentThresholds = { ...DEFAULT_THRESHOLDS };
  return { ...currentThresholds };
}

function checkThreshold(
  type: AlertCheck['type'],
  value: number,
  thresholds: { warning: number; critical: number },
  messageTemplate: string
): AlertCheck | null {
  if (value >= thresholds.critical) {
    return {
      type,
      severity: 'critical',
      message: `${messageTemplate} (${value.toFixed(1)}%) exceeds critical threshold`,
      value,
      threshold: thresholds.critical,
    };
  } else if (value >= thresholds.warning) {
    return {
      type,
      severity: 'warning',
      message: `${messageTemplate} (${value.toFixed(1)}%) exceeds warning threshold`,
      value,
      threshold: thresholds.warning,
    };
  }
  return null;
}

export function checkAlerts(
  metrics: MetricsData,
  thresholds: AlertThresholds = currentThresholds
): AlertCheck[] {
  const alerts: AlertCheck[] = [];

  // Check CPU usage
  const cpuAlert = checkThreshold('cpu', metrics.cpu.usage, thresholds.cpu, 'CPU usage');
  if (cpuAlert) alerts.push(cpuAlert);

  // Check GPU temperature
  if (metrics.gpu && metrics.gpu.temperature !== null) {
    const gpuTempAlert = checkThreshold(
      'gpu_temp',
      metrics.gpu.temperature,
      thresholds.gpu_temp,
      'GPU temperature'
    );
    if (gpuTempAlert) {
      // GPU temperature uses degrees, not percentage
      gpuTempAlert.message = gpuTempAlert.message.replace('%', '\u00B0C');
      alerts.push(gpuTempAlert);
    }
  }

  // Check memory percentage
  const memoryAlert = checkThreshold(
    'memory',
    metrics.memory.percentage,
    thresholds.memory,
    'Memory usage'
  );
  if (memoryAlert) alerts.push(memoryAlert);

  // Note: Disk alerts would be checked separately as they require disk metrics
  // which are not included in the standard MetricsData from WebSocket

  return alerts;
}
