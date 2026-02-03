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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
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
  const memoryPercentage = metrics?.memory.percentage ?? status?.memory.percentage ?? 0;
  const memoryUsed = metrics?.memory.used ?? status?.memory.used ?? 0;
  const memoryTotal = status?.memory.total ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CPU Card */}
      <div className="card">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>CPU</span>
          {status?.cpu.cores && (
            <span className="ml-auto text-xs text-gray-500">{status.cpu.cores} cores</span>
          )}
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="stat-value">{cpuUsage.toFixed(1)}%</div>
            <div className="stat-label">Usage</div>
          </div>
          {cpuTemp !== null && cpuTemp !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{cpuTemp}°C</div>
              <div className="stat-label">Temperature</div>
            </div>
          )}
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${getUsageColor(cpuUsage)}`}
            style={{ width: `${Math.min(cpuUsage, 100)}%` }}
          />
        </div>
      </div>

      {/* Memory Card */}
      <div className="card">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Memory</span>
          {memoryTotal > 0 && (
            <span className="ml-auto text-xs text-gray-500">{formatBytes(memoryTotal)}</span>
          )}
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="stat-value">{memoryPercentage.toFixed(1)}%</div>
            <div className="stat-label">Usage</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{formatBytes(memoryUsed)}</div>
            <div className="stat-label">Used</div>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${getUsageColor(memoryPercentage)}`}
            style={{ width: `${Math.min(memoryPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* System Info Card */}
      {status?.system && (
        <div className="card md:col-span-2">
          <div className="card-header">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span>System Info</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-400">Hostname</div>
              <div className="text-white font-medium">{status.system.hostname}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-white font-medium">{formatUptime(status.system.uptime)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">OS</div>
              <div className="text-white font-medium truncate" title={status.system.os}>
                {status.system.os}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Kernel</div>
              <div className="text-white font-medium truncate" title={status.system.kernel}>
                {status.system.kernel}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
