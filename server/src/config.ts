export interface DashboardConfig {
  server: {
    port: number;
    updateInterval: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      cpu: { warning: number; critical: number };
      gpu_temp: { warning: number; critical: number };
      memory: { warning: number; critical: number };
      disk: { warning: number; critical: number };
    };
  };
}

const defaultConfig: DashboardConfig = {
  server: {
    port: 9000,
    // 10 seconds interval for low resource usage (occasional monitoring)
    updateInterval: 10000,
  },
  alerts: {
    enabled: true,
    thresholds: {
      cpu: { warning: 80, critical: 90 },
      gpu_temp: { warning: 75, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
    },
  },
};

let currentConfig: DashboardConfig = loadConfigFromEnv();

function loadConfigFromEnv(): DashboardConfig {
  const config: DashboardConfig = JSON.parse(JSON.stringify(defaultConfig));

  // Load from environment variables
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (!isNaN(port)) {
      config.server.port = port;
    }
  }

  if (process.env.UPDATE_INTERVAL) {
    const interval = parseInt(process.env.UPDATE_INTERVAL, 10);
    // Minimum 1 second for resource optimization
    if (!isNaN(interval) && interval >= 1000) {
      config.server.updateInterval = interval;
    }
  }

  if (process.env.ALERTS_ENABLED !== undefined) {
    config.alerts.enabled = process.env.ALERTS_ENABLED === 'true';
  }

  // Threshold overrides from environment
  if (process.env.CPU_WARNING) {
    const val = parseInt(process.env.CPU_WARNING, 10);
    if (!isNaN(val)) config.alerts.thresholds.cpu.warning = val;
  }
  if (process.env.CPU_CRITICAL) {
    const val = parseInt(process.env.CPU_CRITICAL, 10);
    if (!isNaN(val)) config.alerts.thresholds.cpu.critical = val;
  }
  if (process.env.GPU_TEMP_WARNING) {
    const val = parseInt(process.env.GPU_TEMP_WARNING, 10);
    if (!isNaN(val)) config.alerts.thresholds.gpu_temp.warning = val;
  }
  if (process.env.GPU_TEMP_CRITICAL) {
    const val = parseInt(process.env.GPU_TEMP_CRITICAL, 10);
    if (!isNaN(val)) config.alerts.thresholds.gpu_temp.critical = val;
  }
  if (process.env.MEMORY_WARNING) {
    const val = parseInt(process.env.MEMORY_WARNING, 10);
    if (!isNaN(val)) config.alerts.thresholds.memory.warning = val;
  }
  if (process.env.MEMORY_CRITICAL) {
    const val = parseInt(process.env.MEMORY_CRITICAL, 10);
    if (!isNaN(val)) config.alerts.thresholds.memory.critical = val;
  }
  if (process.env.DISK_WARNING) {
    const val = parseInt(process.env.DISK_WARNING, 10);
    if (!isNaN(val)) config.alerts.thresholds.disk.warning = val;
  }
  if (process.env.DISK_CRITICAL) {
    const val = parseInt(process.env.DISK_CRITICAL, 10);
    if (!isNaN(val)) config.alerts.thresholds.disk.critical = val;
  }

  return config;
}

export function loadConfig(): DashboardConfig {
  currentConfig = loadConfigFromEnv();
  return JSON.parse(JSON.stringify(currentConfig));
}

export function getConfig(): DashboardConfig {
  return JSON.parse(JSON.stringify(currentConfig));
}

export function updateConfig(partial: Partial<DashboardConfig>): DashboardConfig {
  if (partial.server) {
    if (partial.server.port !== undefined) {
      currentConfig.server.port = partial.server.port;
    }
    if (partial.server.updateInterval !== undefined) {
      currentConfig.server.updateInterval = partial.server.updateInterval;
    }
  }

  if (partial.alerts) {
    if (partial.alerts.enabled !== undefined) {
      currentConfig.alerts.enabled = partial.alerts.enabled;
    }
    if (partial.alerts.thresholds) {
      const thresholds = partial.alerts.thresholds;
      if (thresholds.cpu) {
        currentConfig.alerts.thresholds.cpu = {
          ...currentConfig.alerts.thresholds.cpu,
          ...thresholds.cpu,
        };
      }
      if (thresholds.gpu_temp) {
        currentConfig.alerts.thresholds.gpu_temp = {
          ...currentConfig.alerts.thresholds.gpu_temp,
          ...thresholds.gpu_temp,
        };
      }
      if (thresholds.memory) {
        currentConfig.alerts.thresholds.memory = {
          ...currentConfig.alerts.thresholds.memory,
          ...thresholds.memory,
        };
      }
      if (thresholds.disk) {
        currentConfig.alerts.thresholds.disk = {
          ...currentConfig.alerts.thresholds.disk,
          ...thresholds.disk,
        };
      }
    }
  }

  return JSON.parse(JSON.stringify(currentConfig));
}

export function resetConfig(): DashboardConfig {
  currentConfig = JSON.parse(JSON.stringify(defaultConfig));
  return JSON.parse(JSON.stringify(currentConfig));
}

export function getDefaultConfig(): DashboardConfig {
  return JSON.parse(JSON.stringify(defaultConfig));
}
