import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VisionStatus {
  status: 'running' | 'stopped' | 'error';
  container_id?: string;
  container_name?: string;
  image?: string;
  uptime?: string;
  gpu_attached?: boolean;
  memory_usage?: string;
  error?: string;
}

export interface VisionModel {
  name: string;
  type: string;
  loaded: boolean;
}

export async function getVisionStatus(): Promise<VisionStatus> {
  try {
    // Check if vision brain container is running
    const { stdout } = await execAsync(
      'docker ps --filter "name=gx10-vision" --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}"'
    );

    const line = stdout.trim();
    if (!line) {
      return { status: 'stopped' };
    }

    const [containerId, containerName, image, status] = line.split('|');

    // Check GPU attachment
    let gpuAttached = false;
    try {
      const { stdout: inspectOutput } = await execAsync(
        `docker inspect ${containerId} --format '{{.HostConfig.DeviceRequests}}'`
      );
      gpuAttached = inspectOutput.includes('gpu') || inspectOutput.includes('nvidia');
    } catch {
      // Ignore inspection errors
    }

    // Get memory usage
    let memoryUsage: string | undefined;
    try {
      const { stdout: statsOutput } = await execAsync(
        `docker stats ${containerId} --no-stream --format "{{.MemUsage}}"`
      );
      memoryUsage = statsOutput.trim();
    } catch {
      // Ignore stats errors
    }

    return {
      status: 'running',
      container_id: containerId,
      container_name: containerName,
      image,
      uptime: status,
      gpu_attached: gpuAttached,
      memory_usage: memoryUsage,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getVisionModels(): Promise<VisionModel[]> {
  // Vision brain typically has these models pre-loaded
  // This could be extended to query the actual container for loaded models
  return [
    { name: 'Qwen2.5-VL-32B', type: 'Vision-Language', loaded: true },
  ];
}

export async function checkVisionHealth(): Promise<boolean> {
  try {
    const status = await getVisionStatus();
    return status.status === 'running';
  } catch {
    return false;
  }
}
