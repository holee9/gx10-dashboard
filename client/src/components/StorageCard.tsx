import { useEffect, useState } from 'react';
import { fetchApi } from '../hooks/useFetch';

interface DiskInfo {
  name: string;
  size: string;
  type: 'nvme' | 'ssd' | 'hdd' | 'usb' | 'external';
  model: string;
  mountPoint: string | null;
  total: number;
  used: number;
  available: number;
  percentage: number;
  health?: string;
  temperature?: number;
}

interface StorageStatus {
  disks: DiskInfo[];
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
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

function getDiskIcon(type: DiskInfo['type']) {
  switch (type) {
    case 'nvme':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'ssd':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'usb':
    case 'external':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      );
  }
}

function getDiskTypeLabel(type: DiskInfo['type']): string {
  switch (type) {
    case 'nvme': return 'NVMe SSD';
    case 'ssd': return 'SSD';
    case 'hdd': return 'HDD';
    case 'usb': return 'USB Drive';
    case 'external': return 'External';
    default: return 'Disk';
  }
}

export function StorageCard() {
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const data = await fetchApi<StorageStatus>('/api/metrics/storage');
        setStorage(data);
      } catch {
        // Storage info not available
      } finally {
        setLoading(false);
      }
    };

    fetchStorage();
    const interval = setInterval(fetchStorage, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        <span>Storage</span>
        {storage && storage.disks.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {storage.disks.length} disk{storage.disks.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-gx-cyan" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !storage || storage.disks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No storage devices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {storage.disks.map((disk) => (
            <div key={disk.name} className="p-3 bg-gx-dark rounded-lg">
              {/* Disk Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gx-cyan">{getDiskIcon(disk.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{disk.name}</span>
                    <span className="badge badge-cyan text-xs">{getDiskTypeLabel(disk.type)}</span>
                    {disk.health && (
                      <span className={`badge text-xs ${disk.health === 'Healthy' ? 'badge-green' : 'badge-yellow'}`}>
                        {disk.health}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate" title={disk.model}>
                    {disk.model}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{disk.size}</div>
                  {disk.temperature && (
                    <div className="text-xs text-gray-400">{disk.temperature}°C</div>
                  )}
                </div>
              </div>

              {/* Usage Bar */}
              {disk.mountPoint && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{disk.mountPoint}</span>
                    <span>{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>
                  </div>
                  <div className="h-2 bg-gx-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        disk.percentage > 90 ? 'bg-gx-red' :
                        disk.percentage > 70 ? 'bg-gx-yellow' :
                        'bg-gx-green'
                      }`}
                      style={{ width: `${disk.percentage}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {disk.percentage}% used • {formatBytes(disk.available)} free
                  </div>
                </div>
              )}

              {/* Unmounted disk */}
              {!disk.mountPoint && (
                <div className="mt-2 text-xs text-gray-500">
                  Not mounted
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
