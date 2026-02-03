import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export type BrainMode = 'code' | 'vision';

export interface BrainStatus {
  active: BrainMode;
  started_at: string;
  uptime_seconds: number;
}

export interface BrainSwitchResult {
  success: boolean;
  previous: BrainMode;
  current: BrainMode;
  duration_ms: number;
  error?: string;
}

export interface BrainHistoryEntry {
  timestamp: string;
  from: BrainMode;
  to: BrainMode;
  duration_ms: number;
}

const BRAIN_STATUS_FILE = '/gx10/runtime/active_brain.json';
const BRAIN_SWITCH_SCRIPT = '/gx10/api/switch.sh';
const BRAIN_STATUS_SCRIPT = '/gx10/api/status.sh';

// In-memory history (persisted separately if needed)
const switchHistory: BrainHistoryEntry[] = [];

export async function getBrainStatus(): Promise<BrainStatus> {
  // Try to use the status script first
  try {
    const { stdout } = await execAsync(BRAIN_STATUS_SCRIPT);
    const data = JSON.parse(stdout);
    if (data.brain) {
      return {
        active: data.brain.active || 'code',
        started_at: data.brain.started_at || new Date().toISOString(),
        uptime_seconds: data.brain.uptime_seconds || 0,
      };
    }
  } catch {
    // Script not available, try status file
  }

  // Try to read status file
  try {
    const content = await fs.readFile(BRAIN_STATUS_FILE, 'utf-8');
    const data = JSON.parse(content);
    const startedAt = new Date(data.started_at || Date.now());
    const uptimeSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    return {
      active: data.active || 'code',
      started_at: startedAt.toISOString(),
      uptime_seconds: uptimeSeconds,
    };
  } catch {
    // Return default status
    return {
      active: 'code',
      started_at: new Date().toISOString(),
      uptime_seconds: 0,
    };
  }
}

export async function switchBrain(target: BrainMode): Promise<BrainSwitchResult> {
  const startTime = Date.now();
  const currentStatus = await getBrainStatus();
  const previous = currentStatus.active;

  if (previous === target) {
    return {
      success: true,
      previous,
      current: target,
      duration_ms: Date.now() - startTime,
    };
  }

  // Try to use the switch script
  try {
    await execAsync(`${BRAIN_SWITCH_SCRIPT} ${target}`);

    const duration = Date.now() - startTime;

    // Add to history
    switchHistory.push({
      timestamp: new Date().toISOString(),
      from: previous,
      to: target,
      duration_ms: duration,
    });

    // Keep only last 100 entries
    if (switchHistory.length > 100) {
      switchHistory.shift();
    }

    return {
      success: true,
      previous,
      current: target,
      duration_ms: duration,
    };
  } catch (error) {
    // If script fails, try to update the status file directly (for demo/testing)
    try {
      const statusDir = path.dirname(BRAIN_STATUS_FILE);
      await fs.mkdir(statusDir, { recursive: true });
      await fs.writeFile(
        BRAIN_STATUS_FILE,
        JSON.stringify({
          active: target,
          started_at: new Date().toISOString(),
        })
      );

      const duration = Date.now() - startTime;

      switchHistory.push({
        timestamp: new Date().toISOString(),
        from: previous,
        to: target,
        duration_ms: duration,
      });

      return {
        success: true,
        previous,
        current: target,
        duration_ms: duration,
      };
    } catch {
      return {
        success: false,
        previous,
        current: previous,
        duration_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export function getBrainHistory(): BrainHistoryEntry[] {
  return [...switchHistory].reverse();
}

export async function checkBrainScriptsAvailable(): Promise<{
  statusScript: boolean;
  switchScript: boolean;
}> {
  const [statusExists, switchExists] = await Promise.all([
    fs
      .access(BRAIN_STATUS_SCRIPT)
      .then(() => true)
      .catch(() => false),
    fs
      .access(BRAIN_SWITCH_SCRIPT)
      .then(() => true)
      .catch(() => false),
  ]);

  return {
    statusScript: statusExists,
    switchScript: switchExists,
  };
}
