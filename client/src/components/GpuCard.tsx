import { useStore } from '../store/useStore';

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
      <div className="card h-full">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>GPU</span>
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          GPU not detected
        </div>
      </div>
    );
  }

  const utilization = gpuMetrics?.utilization ?? gpu.utilization;
  const temperature = gpuMetrics?.temperature ?? gpu.temperature;
  const powerDraw = gpuMetrics?.power_draw ?? gpu.power_draw;

  return (
    <div className="card h-full">
      <div className="card-header">
        <svg className="w-4 h-4 text-gx-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        <span>GPU</span>
        <span className="ml-auto text-xs text-gx-green truncate max-w-[100px]" title={gpu.name}>
          {gpu.name}
        </span>
      </div>

      {/* Utilization */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Utilization</span>
          <span className="text-white font-bold">{utilization}%</span>
        </div>
        <div className="h-2 bg-gx-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getUsageColor(utilization)}`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs border-t border-gx-border pt-2">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Temp:</span>
          <span className={getTempColor(temperature)}>{temperature}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Power:</span>
          <span className="text-white">{powerDraw.toFixed(0)}W</span>
        </div>
        {gpu.cuda_version && gpu.cuda_version !== 'N/A' && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">CUDA:</span>
            <span className="text-gx-cyan">{gpu.cuda_version}</span>
          </div>
        )}
      </div>
    </div>
  );
}
