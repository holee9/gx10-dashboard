import { useStore } from '../store/useStore';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'bg-gx-red';
  if (percentage >= 70) return 'bg-gx-yellow';
  return 'bg-gx-green';
}

function getTempColor(temp: number): string {
  if (temp >= 80) return 'text-gx-red';
  if (temp >= 70) return 'text-gx-yellow';
  return 'text-gx-green';
}

export function GpuCard() {
  const { status, metrics } = useStore();

  const gpu = status?.gpu;
  const gpuMetrics = metrics?.gpu;

  if (!gpu) {
    return (
      <div className="card">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>GPU</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>GPU not detected</p>
          <p className="text-sm">nvidia-smi not available</p>
        </div>
      </div>
    );
  }

  const utilization = gpuMetrics?.utilization ?? gpu.utilization;
  const memoryUsed = gpuMetrics?.memory_used ?? gpu.memory_used;
  const temperature = gpuMetrics?.temperature ?? gpu.temperature;
  const powerDraw = gpuMetrics?.power_draw ?? gpu.power_draw;

  // Calculate memory percentage if both values are available
  const memoryPercentage =
    memoryUsed !== null && gpu.memory_total !== null
      ? (memoryUsed / gpu.memory_total) * 100
      : null;

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4 text-gx-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        <span>GPU</span>
        <span className="ml-auto badge badge-green">{gpu.name}</span>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Utilization */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="stat-value">{utilization}%</div>
              <div className="stat-label">Utilization</div>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${getUsageColor(utilization)}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="stat-value">
                {memoryPercentage !== null ? `${memoryPercentage.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="stat-label">VRAM</div>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${memoryPercentage !== null ? getUsageColor(memoryPercentage) : 'bg-gray-600'}`}
              style={{ width: `${memoryPercentage !== null ? Math.min(memoryPercentage, 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gx-border">
        <div>
          <div className="text-sm text-gray-400">Temperature</div>
          <div className={`text-lg font-semibold ${getTempColor(temperature)}`}>
            {temperature}°C
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Power</div>
          <div className="text-lg font-semibold text-white">
            {powerDraw.toFixed(1)}W
            {gpu.power_limit && (
              <span className="text-xs text-gray-500 ml-1">/ {gpu.power_limit}W</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">VRAM Used</div>
          <div className="text-lg font-semibold text-white">
            {formatBytes(memoryUsed)}
            {gpu.memory_total !== null && (
              <span className="text-xs text-gray-500 ml-1">/ {formatBytes(gpu.memory_total)}</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Driver</div>
          <div className="text-lg font-semibold text-white">{gpu.driver_version}</div>
        </div>
      </div>

      {/* CUDA Version */}
      {gpu.cuda_version && gpu.cuda_version !== 'N/A' && (
        <div className="mt-4 pt-4 border-t border-gx-border flex items-center gap-2">
          <span className="text-sm text-gray-400">CUDA</span>
          <span className="badge badge-cyan">{gpu.cuda_version}</span>
        </div>
      )}
    </div>
  );
}
