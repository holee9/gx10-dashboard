import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

export interface GpuProcess {
  pid: number;
  name: string;
  memory_used: number;
}

function parseValue(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '[N/A]' || trimmed === 'N/A' || trimmed === '[Not Supported]') {
    return null;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

export async function getGpuInfo(): Promise<GpuInfo | null> {
  try {
    // Get basic GPU info from CSV query
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,power.draw,power.limit,fan.speed,driver_version --format=csv,noheader,nounits'
    );

    const values = stdout.trim().split(', ');
    if (values.length < 10) return null;

    // Parse CUDA version from standard nvidia-smi output
    let cudaVersion = 'N/A';
    try {
      const { stdout: fullOutput } = await execAsync('nvidia-smi');
      const cudaMatch = fullOutput.match(/CUDA Version:\s*(\d+\.\d+)/);
      if (cudaMatch) {
        cudaVersion = cudaMatch[1];
      }
    } catch {
      // CUDA version not available
    }

    const memTotal = parseValue(values[1]);
    const memUsed = parseValue(values[2]);
    const memFree = parseValue(values[3]);
    const utilization = parseValue(values[4]) ?? 0;
    const temperature = parseValue(values[5]) ?? 0;
    const powerDraw = parseValue(values[6]) ?? 0;
    const powerLimit = parseValue(values[7]);
    const fanSpeed = parseValue(values[8]);

    return {
      name: values[0].trim(),
      memory_total: memTotal !== null ? memTotal * 1024 * 1024 : null, // Convert MiB to bytes
      memory_used: memUsed !== null ? memUsed * 1024 * 1024 : null,
      memory_free: memFree !== null ? memFree * 1024 * 1024 : null,
      utilization,
      temperature,
      power_draw: powerDraw,
      power_limit: powerLimit,
      fan_speed: fanSpeed,
      driver_version: values[9].trim(),
      cuda_version: cudaVersion,
    };
  } catch {
    return null;
  }
}

export async function getGpuProcesses(): Promise<GpuProcess[]> {
  try {
    // Try to get GPU processes using nvidia-smi pmon or standard output
    const { stdout } = await execAsync('nvidia-smi');

    // Parse processes from nvidia-smi output
    const processes: GpuProcess[] = [];
    const lines = stdout.split('\n');
    let inProcessSection = false;

    for (const line of lines) {
      if (line.includes('Processes:')) {
        inProcessSection = true;
        continue;
      }

      if (inProcessSection && line.match(/^\|\s+\d+/)) {
        // Parse process line: |    0   N/A  N/A    3237      G   /usr/lib/xorg/Xorg      43MiB |
        const match = line.match(/\|\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\w+\s+(.+?)\s+(\d+)MiB\s*\|/);
        if (match) {
          processes.push({
            pid: parseInt(match[1], 10),
            name: match[2].trim(),
            memory_used: parseInt(match[3], 10) * 1024 * 1024,
          });
        }
      }
    }

    return processes;
  } catch {
    return [];
  }
}

export async function checkNvidiaSmiAvailable(): Promise<boolean> {
  try {
    await execAsync('nvidia-smi --version');
    return true;
  } catch {
    return false;
  }
}

// Calculate total GPU memory usage from processes (for GPUs that don't report memory.used)
export async function getGpuMemoryFromProcesses(): Promise<number> {
  const processes = await getGpuProcesses();
  return processes.reduce((total, p) => total + p.memory_used, 0);
}
