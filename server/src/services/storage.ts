import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DiskInfo {
  name: string;
  size: string;
  type: 'nvme' | 'ssd' | 'hdd' | 'usb' | 'external';
  model: string;
  mountPoint: string | null;
  total: number;      // bytes
  used: number;       // bytes
  available: number;  // bytes
  percentage: number;
  health?: string;
  temperature?: number;
}

export interface StorageStatus {
  disks: DiskInfo[];
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
}

async function getDiskType(name: string): Promise<'nvme' | 'ssd' | 'hdd' | 'usb' | 'external'> {
  if (name.startsWith('nvme')) return 'nvme';

  try {
    // Check if it's a rotational disk (HDD) or not (SSD)
    const { stdout } = await execAsync(`cat /sys/block/${name}/queue/rotational 2>/dev/null`);
    if (stdout.trim() === '0') return 'ssd';
    if (stdout.trim() === '1') return 'hdd';
  } catch {
    // Ignore
  }

  try {
    // Check if it's a USB device
    const { stdout } = await execAsync(`readlink -f /sys/block/${name} 2>/dev/null`);
    if (stdout.includes('/usb')) return 'usb';
  } catch {
    // Ignore
  }

  return 'external';
}

async function getNvmeTemperature(device: string): Promise<number | undefined> {
  try {
    const { stdout } = await execAsync(`smartctl -A /dev/${device} 2>/dev/null | grep -i temperature`);
    const match = stdout.match(/(\d+)\s*Celsius/i);
    if (match) return parseInt(match[1], 10);
  } catch {
    // smartctl not available or no permission
  }
  return undefined;
}

async function getNvmeHealth(device: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(`smartctl -H /dev/${device} 2>/dev/null`);
    if (stdout.includes('PASSED')) return 'Healthy';
    if (stdout.includes('FAILED')) return 'Warning';
  } catch {
    // smartctl not available
  }
  return undefined;
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const disks: DiskInfo[] = [];

  try {
    // Get block devices (excluding loops and virtual devices)
    const { stdout: lsblkOutput } = await execAsync(
      'lsblk -b -o NAME,SIZE,TYPE,MOUNTPOINT,MODEL -J 2>/dev/null'
    );

    const lsblkData = JSON.parse(lsblkOutput);
    const blockDevices = lsblkData.blockdevices || [];

    // Get disk usage for mounted partitions
    const { stdout: dfOutput } = await execAsync('df -B1 2>/dev/null');
    const dfLines = dfOutput.trim().split('\n').slice(1);
    const mountUsage: Record<string, { total: number; used: number; available: number }> = {};

    for (const line of dfLines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        const mountPoint = parts[5];
        mountUsage[mountPoint] = {
          total: parseInt(parts[1], 10) || 0,
          used: parseInt(parts[2], 10) || 0,
          available: parseInt(parts[3], 10) || 0,
        };
      }
    }

    for (const device of blockDevices) {
      // Skip loop devices, ram, and other virtual devices
      if (device.name.startsWith('loop') ||
          device.name.startsWith('ram') ||
          device.type !== 'disk') {
        continue;
      }

      const diskType = await getDiskType(device.name);
      const model = device.model?.trim() || 'Unknown';

      // Find the main mount point (usually the largest partition)
      let primaryMount: string | null = null;
      let diskTotal = 0;
      let diskUsed = 0;
      let diskAvailable = 0;

      if (device.children) {
        for (const child of device.children) {
          if (child.mountpoint && mountUsage[child.mountpoint]) {
            const usage = mountUsage[child.mountpoint];
            if (usage.total > diskTotal) {
              diskTotal = usage.total;
              diskUsed = usage.used;
              diskAvailable = usage.available;
              primaryMount = child.mountpoint;
            }
          }
        }
      }

      // If no mounted partition, use the device size
      if (!primaryMount) {
        diskTotal = parseInt(device.size, 10) || 0;
      }

      const percentage = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0;

      // Get NVMe specific info
      let temperature: number | undefined;
      let health: string | undefined;

      if (diskType === 'nvme') {
        [temperature, health] = await Promise.all([
          getNvmeTemperature(device.name),
          getNvmeHealth(device.name),
        ]);
      }

      disks.push({
        name: device.name,
        size: formatBytes(parseInt(device.size, 10) || 0),
        type: diskType,
        model,
        mountPoint: primaryMount,
        total: diskTotal,
        used: diskUsed,
        available: diskAvailable,
        percentage,
        health,
        temperature,
      });
    }
  } catch (error) {
    console.error('Error getting storage status:', error);
  }

  // Calculate totals
  const totalStorage = disks.reduce((sum, d) => sum + d.total, 0);
  const usedStorage = disks.reduce((sum, d) => sum + d.used, 0);
  const availableStorage = disks.reduce((sum, d) => sum + d.available, 0);

  return {
    disks,
    totalStorage,
    usedStorage,
    availableStorage,
  };
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
