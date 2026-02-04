export interface SystemInfo {
  hostname: string;
  uptime: number;
  os: string;
  kernel: string;
  arch: string;
}

export interface CpuInfo {
  usage: number;
  cores: number;
  temperature: number | null;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
  mountPoint: string;
}

export interface GpuInfo {
  name: string;
  memory_total: number | null;
  memory_used: number | null;
  memory_free: number | null;
  utilization: number;
  temperature: number;
  power_draw: number;
  power_limit: number | null;
  fan_speed: number | null;
  driver_version: string;
  cuda_version: string;
}

export interface BrainStatus {
  active: 'code' | 'vision';
  started_at: string;
  uptime_seconds: number;
  scripts_available?: {
    statusScript: boolean;
    switchScript: boolean;
  };
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaRunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  expires_at: string;
  size_vram: number;
}

export interface OllamaStatus {
  status: 'running' | 'stopped' | 'unknown';
  version?: string;
  models: OllamaModel[];
  running_models: OllamaRunningModel[];
}

export interface FullStatus {
  timestamp: string;
  system: SystemInfo;
  cpu: CpuInfo;
  memory: MemoryInfo;
  disk: DiskInfo[];
  gpu: GpuInfo | null;
  brain: BrainStatus;
  ollama: {
    status: string;
    version?: string;
    models_loaded: string[];
  };
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
  network: {
    rxMbps: number;
    txMbps: number;
  };
  brain: {
    active: string;
  };
  ollama: {
    models_loaded: string[];
  };
}

// Alert System Types
export type AlertSeverity = 'warning' | 'critical';
export type AlertType = 'cpu' | 'gpu_temp' | 'memory' | 'disk';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  dismissed: boolean;
}

export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  gpu_temp: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
}

// Process Monitoring Types
export interface GpuProcess {
  pid: number;
  processName: string;
  gpuMemoryUsed: number;
  gpuUtilization: number;
  memUtilization: number;
  type: 'C' | 'G' | 'C+G';
}

export interface CpuCore {
  core: number;
  usage: number;
  frequency: number;
}

export interface DetailedMemory {
  total: number;
  used: number;
  free: number;
  available: number;
  buffers: number;
  cached: number;
  swapTotal: number;
  swapUsed: number;
  swapFree: number;
}

export interface TopProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
  memoryMB: number;
  user: string;
}
