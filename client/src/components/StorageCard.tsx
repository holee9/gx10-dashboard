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

function getDiskTypeLabel(type: DiskInfo['type']): string {
  switch (type) {
    case 'nvme': return 'NVMe';
    case 'ssd': return 'SSD';
    case 'hdd': return 'HDD';
    case 'usb': return 'USB';
    case 'external': return 'Ext';
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
    const interval = setInterval(fetchStorage, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card h-full">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span>Storage</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-gx-cyan" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !storage || storage.disks.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No disks found
        </div>
      ) : (
        <div className="space-y-2">
          {storage.disks.map((disk) => (
            <div key={disk.name} className="p-2 bg-gx-dark rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white font-medium">{disk.name}</span>
                  <span className="text-xs text-gx-cyan">{getDiskTypeLabel(disk.type)}</span>
                </div>
                <span className="text-xs text-gray-400">{disk.size}</span>
              </div>
              {disk.mountPoint && (
                <>
                  <div className="h-1.5 bg-gx-border rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        disk.percentage > 90 ? 'bg-gx-red' :
                        disk.percentage > 70 ? 'bg-gx-yellow' :
                        'bg-gx-green'
                      }`}
                      style={{ width: `${disk.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{disk.mountPoint}</span>
                    <span>{disk.percentage}% • {formatBytes(disk.available)} free</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
