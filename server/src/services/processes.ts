import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

// GPU Process information from nvidia-smi pmon
export interface GpuProcess {
  pid: number;
  processName: string;
  gpuMemoryUsed: number; // MB
  gpuUtilization: number; // %
  memUtilization: number; // %
  type: 'C' | 'G' | 'C+G'; // Compute, Graphics, or Both
}

// CPU Core information
export interface CpuCore {
  core: number;
  usage: number;
  frequency: number; // MHz
}

// Detailed memory information
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

// Top processes by CPU/Memory
export interface TopProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
  memoryMB: number;
  user: string;
}

// Store previous CPU times for usage calculation
let lastCpuCoreTimes: Map<number, { idle: number; total: number }> = new Map();

/**
 * Get GPU processes with detailed utilization information
 * Uses nvidia-smi pmon for per-process GPU/memory utilization
 */
export async function getGpuProcesses(): Promise<GpuProcess[]> {
  try {
    // First try pmon for detailed utilization data
    const { stdout: pmonOutput } = await execAsync(
      'nvidia-smi pmon -s um -c 1 2>/dev/null || echo ""'
    );

    const processes: GpuProcess[] = [];
    const lines = pmonOutput.trim().split('\n');

    // Skip header lines (start with #)
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;

      // pmon format: gpu pid type sm mem enc dec command
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 8) {
        const pid = parseInt(parts[1], 10);
        if (isNaN(pid) || pid === 0) continue;

        const typeStr = parts[2];
        let type: 'C' | 'G' | 'C+G' = 'C';
        if (typeStr === 'G') type = 'G';
        else if (typeStr === 'C+G') type = 'C+G';

        const smUtil = parseInt(parts[3], 10) || 0;
        const memUtil = parseInt(parts[4], 10) || 0;
        const processName = parts.slice(7).join(' ');

        // Get memory usage from compute-apps query
        let gpuMemoryUsed = 0;
        try {
          const { stdout: memOutput } = await execAsync(
            `nvidia-smi --query-compute-apps=pid,used_memory --format=csv,noheader,nounits 2>/dev/null | grep "^${pid}," || echo ""`
          );
          if (memOutput.trim()) {
            const memParts = memOutput.trim().split(',');
            if (memParts.length >= 2) {
              gpuMemoryUsed = parseInt(memParts[1].trim(), 10) || 0;
            }
          }
        } catch {
          // Memory info not available
        }

        processes.push({
          pid,
          processName: processName || 'Unknown',
          gpuMemoryUsed,
          gpuUtilization: smUtil,
          memUtilization: memUtil,
          type,
        });
      }
    }

    // If pmon didn't return data, fall back to compute-apps query
    if (processes.length === 0) {
      const { stdout } = await execAsync(
        'nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader,nounits 2>/dev/null || echo ""'
      );

      for (const line of stdout.trim().split('\n')) {
        if (!line.trim()) continue;
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const pid = parseInt(parts[0], 10);
          if (isNaN(pid)) continue;

          processes.push({
            pid,
            processName: parts[1] || 'Unknown',
            gpuMemoryUsed: parseInt(parts[2], 10) || 0,
            gpuUtilization: 0, // Not available from this query
            memUtilization: 0,
            type: 'C',
          });
        }
      }
    }

    return processes;
  } catch {
    // nvidia-smi not available or failed
    return [];
  }
}

/**
 * Get per-core CPU usage and frequency
 * Parses /proc/stat for usage and /proc/cpuinfo for frequencies
 */
export async function getCpuCores(): Promise<CpuCore[]> {
  try {
    // Read /proc/stat for per-core usage
    const statContent = await fs.readFile('/proc/stat', 'utf-8');
    const statLines = statContent.split('\n');

    // Read /proc/cpuinfo for frequencies
    const cpuinfoContent = await fs.readFile('/proc/cpuinfo', 'utf-8');
    const frequencies: number[] = [];

    // Parse frequencies from cpuinfo
    const freqRegex = /cpu MHz\s*:\s*(\d+(?:\.\d+)?)/g;
    let freqMatch: RegExpExecArray | null;
    while ((freqMatch = freqRegex.exec(cpuinfoContent)) !== null) {
      frequencies.push(Math.round(parseFloat(freqMatch[1])));
    }

    const cores: CpuCore[] = [];

    for (const line of statLines) {
      // Match cpu0, cpu1, etc. (skip the aggregate 'cpu' line)
      const match = line.match(/^cpu(\d+)\s+(.+)/);
      if (!match) continue;

      const coreNum = parseInt(match[1], 10);
      const values = match[2].split(/\s+/).map(Number);

      // CPU time values: user, nice, system, idle, iowait, irq, softirq, steal, guest, guest_nice
      const idle = values[3] + (values[4] || 0); // idle + iowait
      const total = values.reduce((a, b) => a + b, 0);

      let usage = 0;
      const lastTimes = lastCpuCoreTimes.get(coreNum);

      if (lastTimes) {
        const idleDiff = idle - lastTimes.idle;
        const totalDiff = total - lastTimes.total;
        usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
      }

      lastCpuCoreTimes.set(coreNum, { idle, total });

      cores.push({
        core: coreNum,
        usage: Math.round(usage * 10) / 10,
        frequency: frequencies[coreNum] || 0,
      });
    }

    return cores.sort((a, b) => a.core - b.core);
  } catch {
    return [];
  }
}

/**
 * Get detailed memory information including swap
 * Parses /proc/meminfo for comprehensive memory stats
 */
export async function getDetailedMemory(): Promise<DetailedMemory> {
  try {
    const content = await fs.readFile('/proc/meminfo', 'utf-8');
    const memInfo: Record<string, number> = {};

    // Parse all memory values (in kB)
    for (const line of content.split('\n')) {
      const match = line.match(/^(\w+):\s+(\d+)/);
      if (match) {
        memInfo[match[1]] = parseInt(match[2], 10) * 1024; // Convert to bytes
      }
    }

    const total = memInfo['MemTotal'] || 0;
    const free = memInfo['MemFree'] || 0;
    const available = memInfo['MemAvailable'] || free;
    const buffers = memInfo['Buffers'] || 0;
    const cached = memInfo['Cached'] || 0;
    const swapTotal = memInfo['SwapTotal'] || 0;
    const swapFree = memInfo['SwapFree'] || 0;
    const swapUsed = swapTotal - swapFree;

    // Calculate used memory (excluding buffers/cache for actual usage)
    const used = total - available;

    return {
      total,
      used,
      free,
      available,
      buffers,
      cached,
      swapTotal,
      swapUsed,
      swapFree,
    };
  } catch {
    // Return zeros if unable to read meminfo
    return {
      total: 0,
      used: 0,
      free: 0,
      available: 0,
      buffers: 0,
      cached: 0,
      swapTotal: 0,
      swapUsed: 0,
      swapFree: 0,
    };
  }
}

/**
 * Get top processes sorted by CPU usage
 * Uses ps command to get process information
 */
export async function getTopProcesses(limit: number = 10): Promise<TopProcess[]> {
  try {
    // ps aux with sort by CPU
    // Format: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
    const { stdout } = await execAsync(
      `ps aux --sort=-%cpu 2>/dev/null | head -n ${limit + 1}`
    );

    const lines = stdout.trim().split('\n');
    const processes: TopProcess[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length < 11) continue;

      const user = parts[0];
      const pid = parseInt(parts[1], 10);
      const cpuPercent = parseFloat(parts[2]) || 0;
      const memPercent = parseFloat(parts[3]) || 0;
      const rss = parseInt(parts[5], 10) || 0; // RSS in KB
      const command = parts.slice(10).join(' ');

      // Extract process name from command (first part, without path)
      const name = command.split('/').pop()?.split(' ')[0] || command;

      processes.push({
        pid,
        name,
        cpuPercent,
        memPercent,
        memoryMB: Math.round(rss / 1024), // Convert KB to MB
        user,
      });
    }

    return processes;
  } catch {
    return [];
  }
}

/**
 * Get top processes sorted by memory usage
 * Uses ps command to get process information
 */
export async function getTopProcessesByMemory(limit: number = 10): Promise<TopProcess[]> {
  try {
    const { stdout } = await execAsync(
      `ps aux --sort=-%mem 2>/dev/null | head -n ${limit + 1}`
    );

    const lines = stdout.trim().split('\n');
    const processes: TopProcess[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length < 11) continue;

      const user = parts[0];
      const pid = parseInt(parts[1], 10);
      const cpuPercent = parseFloat(parts[2]) || 0;
      const memPercent = parseFloat(parts[3]) || 0;
      const rss = parseInt(parts[5], 10) || 0;
      const command = parts.slice(10).join(' ');

      const name = command.split('/').pop()?.split(' ')[0] || command;

      processes.push({
        pid,
        name,
        cpuPercent,
        memPercent,
        memoryMB: Math.round(rss / 1024),
        user,
      });
    }

    return processes;
  } catch {
    return [];
  }
}
