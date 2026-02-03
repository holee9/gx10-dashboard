import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';

const execAsync = promisify(exec);

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

export interface SystemInfo {
  hostname: string;
  uptime: number;
  os: string;
  kernel: string;
  arch: string;
}

let lastCpuTimes: { idle: number; total: number } | null = null;

async function parseCpuStats(): Promise<{ idle: number; total: number }> {
  const content = await fs.readFile('/proc/stat', 'utf-8');
  const cpuLine = content.split('\n')[0];
  const values = cpuLine.split(/\s+/).slice(1).map(Number);

  const idle = values[3] + (values[4] || 0);
  const total = values.reduce((a, b) => a + b, 0);

  return { idle, total };
}

export async function getCpuInfo(): Promise<CpuInfo> {
  const cores = os.cpus().length;

  // Calculate CPU usage
  const currentTimes = await parseCpuStats();
  let usage = 0;

  if (lastCpuTimes) {
    const idleDiff = currentTimes.idle - lastCpuTimes.idle;
    const totalDiff = currentTimes.total - lastCpuTimes.total;
    usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
  }

  lastCpuTimes = currentTimes;

  // Get CPU temperature
  let temperature: number | null = null;
  try {
    const { stdout } = await execAsync('sensors -j 2>/dev/null || echo "{}"');
    const data = JSON.parse(stdout);
    // Try to find CPU temperature from various sources
    for (const device of Object.values(data) as Record<string, unknown>[]) {
      if (typeof device === 'object' && device !== null) {
        for (const [key, value] of Object.entries(device)) {
          if (key.toLowerCase().includes('core') || key.toLowerCase().includes('cpu')) {
            const tempValue = value as Record<string, number>;
            const tempKey = Object.keys(tempValue).find(k => k.includes('input'));
            if (tempKey && tempValue[tempKey]) {
              temperature = tempValue[tempKey];
              break;
            }
          }
        }
      }
      if (temperature !== null) break;
    }
  } catch {
    // Temperature not available
  }

  return {
    usage: Math.round(usage * 10) / 10,
    cores,
    temperature,
  };
}

export async function getMemoryInfo(): Promise<MemoryInfo> {
  try {
    const { stdout } = await execAsync('free -b');
    const lines = stdout.trim().split('\n');
    const memLine = lines[1].split(/\s+/);

    const total = parseInt(memLine[1], 10);
    const used = parseInt(memLine[2], 10);
    const free = parseInt(memLine[3], 10);
    const percentage = (used / total) * 100;

    return {
      total,
      used,
      free,
      percentage: Math.round(percentage * 10) / 10,
    };
  } catch {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: Math.round((usedMem / totalMem) * 1000) / 10,
    };
  }
}

export async function getDiskInfo(): Promise<DiskInfo[]> {
  try {
    const { stdout } = await execAsync('df -B1 / /home 2>/dev/null || df -B1 /');
    const lines = stdout.trim().split('\n').slice(1);
    const seen = new Set<string>();

    return lines
      .map(line => {
        const parts = line.split(/\s+/);
        const mountPoint = parts[5];
        if (seen.has(mountPoint)) return null;
        seen.add(mountPoint);

        const total = parseInt(parts[1], 10);
        const used = parseInt(parts[2], 10);
        const free = parseInt(parts[3], 10);

        return {
          total,
          used,
          free,
          percentage: Math.round((used / total) * 1000) / 10,
          mountPoint,
        };
      })
      .filter((d): d is DiskInfo => d !== null);
  } catch {
    return [];
  }
}

export async function getSystemInfo(): Promise<SystemInfo> {
  let osRelease = 'Linux';
  try {
    const content = await fs.readFile('/etc/os-release', 'utf-8');
    const match = content.match(/PRETTY_NAME="([^"]+)"/);
    if (match) {
      osRelease = match[1];
    }
  } catch {
    // Use default
  }

  return {
    hostname: os.hostname(),
    uptime: Math.floor(os.uptime()),
    os: osRelease,
    kernel: os.release(),
    arch: os.arch(),
  };
}
