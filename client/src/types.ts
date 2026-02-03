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
  brain: {
    active: string;
  };
  ollama: {
    models_loaded: string[];
  };
}
