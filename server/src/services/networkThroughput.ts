import { readFile } from 'fs/promises';

interface ThroughputData {
  rxBytesPerSec: number;
  txBytesPerSec: number;
  rxMbps: number;
  txMbps: number;
}

interface InterfaceStats {
  rxBytes: number;
  txBytes: number;
  timestamp: number;
}

// Store previous stats for delta calculation
const previousStats: Map<string, InterfaceStats> = new Map();

async function readInterfaceStats(interfaceName: string): Promise<InterfaceStats | null> {
  try {
    const [rxBytes, txBytes] = await Promise.all([
      readFile(`/sys/class/net/${interfaceName}/statistics/rx_bytes`, 'utf-8'),
      readFile(`/sys/class/net/${interfaceName}/statistics/tx_bytes`, 'utf-8'),
    ]);

    return {
      rxBytes: parseInt(rxBytes.trim(), 10),
      txBytes: parseInt(txBytes.trim(), 10),
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

async function getActiveInterface(): Promise<string | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Get default route interface
    const { stdout } = await execAsync("ip route | grep default | head -1 | awk '{print $5}'");
    const interfaceName = stdout.trim();

    if (interfaceName) {
      return interfaceName;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getNetworkThroughput(): Promise<ThroughputData> {
  const interfaceName = await getActiveInterface();

  if (!interfaceName) {
    return { rxBytesPerSec: 0, txBytesPerSec: 0, rxMbps: 0, txMbps: 0 };
  }

  const currentStats = await readInterfaceStats(interfaceName);

  if (!currentStats) {
    return { rxBytesPerSec: 0, txBytesPerSec: 0, rxMbps: 0, txMbps: 0 };
  }

  const prevStats = previousStats.get(interfaceName);
  previousStats.set(interfaceName, currentStats);

  if (!prevStats) {
    // First read, no delta yet
    return { rxBytesPerSec: 0, txBytesPerSec: 0, rxMbps: 0, txMbps: 0 };
  }

  const timeDelta = (currentStats.timestamp - prevStats.timestamp) / 1000; // seconds

  if (timeDelta <= 0) {
    return { rxBytesPerSec: 0, txBytesPerSec: 0, rxMbps: 0, txMbps: 0 };
  }

  const rxBytesPerSec = Math.max(0, (currentStats.rxBytes - prevStats.rxBytes) / timeDelta);
  const txBytesPerSec = Math.max(0, (currentStats.txBytes - prevStats.txBytes) / timeDelta);

  // Convert to Mbps (megabits per second)
  const rxMbps = (rxBytesPerSec * 8) / 1_000_000;
  const txMbps = (txBytesPerSec * 8) / 1_000_000;

  return {
    rxBytesPerSec: Math.round(rxBytesPerSec),
    txBytesPerSec: Math.round(txBytesPerSec),
    rxMbps: Math.round(rxMbps * 100) / 100, // 2 decimal places
    txMbps: Math.round(txMbps * 100) / 100,
  };
}
