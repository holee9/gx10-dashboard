import { useStore } from '../store/useStore';

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

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'bg-gx-red';
  if (percentage >= 70) return 'bg-gx-yellow';
  return 'bg-gx-green';
}

export function SystemCard() {
  const { status, metrics } = useStore();

  const cpuUsage = metrics?.cpu.usage ?? status?.cpu.usage ?? 0;
  const cpuTemp = metrics?.cpu.temperature ?? status?.cpu.temperature;
  const cpuCores = status?.cpu.cores;
  const memoryPercentage = metrics?.memory.percentage ?? status?.memory.percentage ?? 0;
  const memoryUsed = metrics?.memory.used ?? status?.memory.used ?? 0;
  const memoryTotal = status?.memory.total ?? 0;

  return (
    <div className="card h-full">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        <span>CPU / Memory</span>
      </div>

      {/* CPU Section */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">
            CPU {cpuCores && `(${cpuCores} cores)`}
          </span>
          <div className="flex items-center gap-2">
            {cpuTemp !== null && cpuTemp !== undefined && (
              <span className="text-xs text-gray-400">{cpuTemp}°C</span>
            )}
            <span className="text-white font-bold">{cpuUsage.toFixed(1)}%</span>
          </div>
        </div>
        <div className="h-2 bg-gx-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getUsageColor(cpuUsage)}`}
            style={{ width: `${Math.min(cpuUsage, 100)}%` }}
          />
        </div>
      </div>

      {/* Memory Section */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">
            Memory {memoryTotal > 0 && `(${formatBytes(memoryTotal)})`}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{formatBytes(memoryUsed)}</span>
            <span className="text-white font-bold">{memoryPercentage.toFixed(1)}%</span>
          </div>
        </div>
        <div className="h-2 bg-gx-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getUsageColor(memoryPercentage)}`}
            style={{ width: `${Math.min(memoryPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
