import { Router, Request, Response } from 'express';
import { getCpuInfo, getMemoryInfo, getDiskInfo } from '../services/system.js';
import { getGpuInfo } from '../services/nvidia.js';
import { getBrainStatus } from '../services/brain.js';
import { getOllamaStatus } from '../services/ollama.js';

const router = Router();

/**
 * GET /metrics - Prometheus OpenMetrics format
 *
 * Exposes system metrics in Prometheus text format for scraping.
 * All metrics are prefixed with 'gx10_' for namespacing.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [cpu, memory, disk, gpu, brain, ollama] = await Promise.all([
      getCpuInfo(),
      getMemoryInfo(),
      getDiskInfo(),
      getGpuInfo(),
      getBrainStatus(),
      getOllamaStatus().catch(() => ({ status: 'stopped', version: null })),
    ]);

    const metrics: string[] = [];
    const timestamp = Date.now();

    // CPU Metrics
    metrics.push('# HELP gx10_cpu_usage_percent CPU usage percentage');
    metrics.push('# TYPE gx10_cpu_usage_percent gauge');
    metrics.push(`gx10_cpu_usage_percent ${cpu.usage.toFixed(2)}`);

    metrics.push('# HELP gx10_cpu_cores_total Total number of CPU cores');
    metrics.push('# TYPE gx10_cpu_cores_total gauge');
    metrics.push(`gx10_cpu_cores_total ${cpu.cores}`);

    metrics.push('# HELP gx10_cpu_temperature_celsius CPU temperature in Celsius');
    metrics.push('# TYPE gx10_cpu_temperature_celsius gauge');
    metrics.push(`gx10_cpu_temperature_celsius ${cpu.temperature ?? 0}`);

    // Memory Metrics
    metrics.push('# HELP gx10_memory_used_bytes Memory used in bytes');
    metrics.push('# TYPE gx10_memory_used_bytes gauge');
    metrics.push(`gx10_memory_used_bytes ${memory.used}`);

    metrics.push('# HELP gx10_memory_total_bytes Total memory in bytes');
    metrics.push('# TYPE gx10_memory_total_bytes gauge');
    metrics.push(`gx10_memory_total_bytes ${memory.total}`);

    metrics.push('# HELP gx10_memory_free_bytes Free memory in bytes');
    metrics.push('# TYPE gx10_memory_free_bytes gauge');
    metrics.push(`gx10_memory_free_bytes ${memory.free}`);

    metrics.push('# HELP gx10_memory_usage_percent Memory usage percentage');
    metrics.push('# TYPE gx10_memory_usage_percent gauge');
    metrics.push(`gx10_memory_usage_percent ${memory.percentage.toFixed(2)}`);

    // Disk Metrics (with mount point labels)
    metrics.push('# HELP gx10_disk_used_bytes Disk space used in bytes');
    metrics.push('# TYPE gx10_disk_used_bytes gauge');
    metrics.push('# HELP gx10_disk_total_bytes Total disk space in bytes');
    metrics.push('# TYPE gx10_disk_total_bytes gauge');
    metrics.push('# HELP gx10_disk_free_bytes Free disk space in bytes');
    metrics.push('# TYPE gx10_disk_free_bytes gauge');
    metrics.push('# HELP gx10_disk_usage_percent Disk usage percentage');
    metrics.push('# TYPE gx10_disk_usage_percent gauge');

    for (const d of disk) {
      const mountLabel = `mountpoint="${d.mountPoint}"`;
      metrics.push(`gx10_disk_used_bytes{${mountLabel}} ${d.used}`);
      metrics.push(`gx10_disk_total_bytes{${mountLabel}} ${d.total}`);
      metrics.push(`gx10_disk_free_bytes{${mountLabel}} ${d.free}`);
      metrics.push(`gx10_disk_usage_percent{${mountLabel}} ${d.percentage.toFixed(2)}`);
    }

    // GPU Metrics (if available)
    if (gpu) {
      metrics.push('# HELP gx10_gpu_utilization_percent GPU utilization percentage');
      metrics.push('# TYPE gx10_gpu_utilization_percent gauge');
      metrics.push(`gx10_gpu_utilization_percent ${gpu.utilization}`);

      metrics.push('# HELP gx10_gpu_memory_used_bytes GPU memory used in bytes');
      metrics.push('# TYPE gx10_gpu_memory_used_bytes gauge');
      metrics.push(`gx10_gpu_memory_used_bytes ${gpu.memory_used ?? 0}`);

      metrics.push('# HELP gx10_gpu_memory_total_bytes GPU memory total in bytes');
      metrics.push('# TYPE gx10_gpu_memory_total_bytes gauge');
      metrics.push(`gx10_gpu_memory_total_bytes ${gpu.memory_total ?? 0}`);

      metrics.push('# HELP gx10_gpu_memory_free_bytes GPU memory free in bytes');
      metrics.push('# TYPE gx10_gpu_memory_free_bytes gauge');
      metrics.push(`gx10_gpu_memory_free_bytes ${gpu.memory_free ?? 0}`);

      metrics.push('# HELP gx10_gpu_temperature_celsius GPU temperature in Celsius');
      metrics.push('# TYPE gx10_gpu_temperature_celsius gauge');
      metrics.push(`gx10_gpu_temperature_celsius ${gpu.temperature}`);

      metrics.push('# HELP gx10_gpu_power_watts GPU power draw in watts');
      metrics.push('# TYPE gx10_gpu_power_watts gauge');
      metrics.push(`gx10_gpu_power_watts ${gpu.power_draw}`);

      if (gpu.power_limit !== null) {
        metrics.push('# HELP gx10_gpu_power_limit_watts GPU power limit in watts');
        metrics.push('# TYPE gx10_gpu_power_limit_watts gauge');
        metrics.push(`gx10_gpu_power_limit_watts ${gpu.power_limit}`);
      }

      if (gpu.fan_speed !== null) {
        metrics.push('# HELP gx10_gpu_fan_speed_percent GPU fan speed percentage');
        metrics.push('# TYPE gx10_gpu_fan_speed_percent gauge');
        metrics.push(`gx10_gpu_fan_speed_percent ${gpu.fan_speed}`);
      }

      // GPU info labels
      metrics.push('# HELP gx10_gpu_info GPU information');
      metrics.push('# TYPE gx10_gpu_info gauge');
      metrics.push(
        `gx10_gpu_info{name="${gpu.name}",driver="${gpu.driver_version}",cuda="${gpu.cuda_version}"} 1`
      );
    }

    // Brain Metrics
    metrics.push('# HELP gx10_brain_active Current active brain (1=code, 2=vision)');
    metrics.push('# TYPE gx10_brain_active gauge');
    metrics.push(`gx10_brain_active ${brain.active === 'code' ? 1 : 2}`);

    metrics.push('# HELP gx10_brain_mode Brain mode as labeled metric');
    metrics.push('# TYPE gx10_brain_mode gauge');
    metrics.push(`gx10_brain_mode{mode="code"} ${brain.active === 'code' ? 1 : 0}`);
    metrics.push(`gx10_brain_mode{mode="vision"} ${brain.active === 'vision' ? 1 : 0}`);

    metrics.push('# HELP gx10_brain_uptime_seconds Brain uptime in seconds');
    metrics.push('# TYPE gx10_brain_uptime_seconds counter');
    metrics.push(`gx10_brain_uptime_seconds ${brain.uptime_seconds}`);

    // Ollama Metrics
    metrics.push('# HELP gx10_ollama_up Ollama service status (1=running, 0=stopped)');
    metrics.push('# TYPE gx10_ollama_up gauge');
    metrics.push(`gx10_ollama_up ${ollama.status === 'running' ? 1 : 0}`);

    // Server Metrics
    metrics.push('# HELP gx10_server_uptime_seconds Dashboard server uptime in seconds');
    metrics.push('# TYPE gx10_server_uptime_seconds counter');
    metrics.push(`gx10_server_uptime_seconds ${Math.floor(process.uptime())}`);

    metrics.push('# HELP gx10_scrape_timestamp_milliseconds Timestamp of metrics collection');
    metrics.push('# TYPE gx10_scrape_timestamp_milliseconds gauge');
    metrics.push(`gx10_scrape_timestamp_milliseconds ${timestamp}`);

    // Set proper content type for Prometheus
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics.join('\n') + '\n');
  } catch (error) {
    // Return error in Prometheus format
    res.status(500).set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(
      `# Error collecting metrics\n# ERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n`
    );
  }
});

export default router;
