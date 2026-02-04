import { useState, useEffect, useCallback } from 'react';
import type { DetailedMemory } from '../types';

// Mock data for development - replace with actual API calls
const mockDetailedMemory: DetailedMemory = {
  total: 64 * 1024, // 64 GB in MB
  used: 24 * 1024,
  free: 8 * 1024,
  available: 32 * 1024,
  buffers: 2 * 1024,
  cached: 22 * 1024,
  swapTotal: 16 * 1024,
  swapUsed: 512,
  swapFree: 15.5 * 1024,
};

function formatBytes(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

interface MemorySegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  bgColor: string;
}

interface MemoryDetailCardProps {
  expanded?: boolean;
}

export function MemoryDetailCard({ expanded = false }: MemoryDetailCardProps) {
  const [memory, setMemory] = useState<DetailedMemory | null>(null);
  const [isExpanded, setIsExpanded] = useState(expanded);

  const fetchMemory = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/memory/detailed');
      // const data = await response.json();
      // setMemory(data);

      // Simulate slight variations in mock data
      setMemory({
        ...mockDetailedMemory,
        used: mockDetailedMemory.used + (Math.random() - 0.5) * 1024,
        cached: mockDetailedMemory.cached + (Math.random() - 0.5) * 512,
      });
    } catch (error) {
      console.error('Failed to fetch memory details:', error);
    }
  }, []);

  useEffect(() => {
    fetchMemory();
    const interval = setInterval(fetchMemory, 5000);
    return () => clearInterval(interval);
  }, [fetchMemory]);

  if (!memory) {
    return (
      <div className="card">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Memory Details</span>
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          Loading memory details...
        </div>
      </div>
    );
  }

  const segments: MemorySegment[] = [
    {
      label: 'Used',
      value: memory.used - memory.buffers - memory.cached,
      percentage: getPercentage(memory.used - memory.buffers - memory.cached, memory.total),
      color: 'text-gx-red',
      bgColor: 'bg-gx-red',
    },
    {
      label: 'Buffers',
      value: memory.buffers,
      percentage: getPercentage(memory.buffers, memory.total),
      color: 'text-gx-yellow',
      bgColor: 'bg-gx-yellow',
    },
    {
      label: 'Cached',
      value: memory.cached,
      percentage: getPercentage(memory.cached, memory.total),
      color: 'text-gx-cyan',
      bgColor: 'bg-gx-cyan',
    },
    {
      label: 'Available',
      value: memory.available,
      percentage: getPercentage(memory.available, memory.total),
      color: 'text-gx-green',
      bgColor: 'bg-gx-green',
    },
  ];

  const usedPercentage = getPercentage(memory.used, memory.total);
  const swapPercentage = getPercentage(memory.swapUsed, memory.swapTotal);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="card-header mb-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Memory Details</span>
          <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
            ({formatBytes(memory.total)})
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Stacked Bar Chart */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Physical Memory</span>
          <span className="text-xs text-white font-medium">{usedPercentage.toFixed(1)}% used</span>
        </div>
        <div className="h-4 bg-gx-border rounded-full overflow-hidden flex">
          {/* Used (excluding buffers/cached) */}
          <div
            className="bg-gx-red transition-all duration-300"
            style={{ width: `${segments[0].percentage}%` }}
            title={`Used: ${formatBytes(segments[0].value)}`}
          />
          {/* Buffers */}
          <div
            className="bg-gx-yellow transition-all duration-300"
            style={{ width: `${segments[1].percentage}%` }}
            title={`Buffers: ${formatBytes(segments[1].value)}`}
          />
          {/* Cached */}
          <div
            className="bg-gx-cyan transition-all duration-300"
            style={{ width: `${segments[2].percentage}%` }}
            title={`Cached: ${formatBytes(segments[2].value)}`}
          />
          {/* Free/Available is the remaining space */}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {segments.slice(0, 3).map(segment => (
            <div key={segment.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded ${segment.bgColor}`} />
              <span className="text-[10px] text-gray-400">
                {segment.label}: <span className={segment.color}>{formatBytes(segment.value)}</span>
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded bg-gx-border" />
            <span className="text-[10px] text-gray-400">
              Free: <span className="text-gray-300">{formatBytes(memory.free)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gx-border space-y-3">
          {/* Swap Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Swap ({formatBytes(memory.swapTotal)})</span>
              <span className={`text-xs font-medium ${swapPercentage > 50 ? 'text-gx-yellow' : 'text-gray-300'}`}>
                {swapPercentage.toFixed(1)}% used
              </span>
            </div>
            <div className="h-2 bg-gx-border rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  swapPercentage > 80 ? 'bg-gx-red' :
                  swapPercentage > 50 ? 'bg-gx-yellow' :
                  'bg-gx-purple'
                }`}
                style={{ width: `${Math.min(swapPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Used: {formatBytes(memory.swapUsed)}</span>
              <span>Free: {formatBytes(memory.swapFree)}</span>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gx-border/30 rounded-lg p-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
              <div className="text-sm text-white font-medium">{formatBytes(memory.total)}</div>
            </div>
            <div className="bg-gx-border/30 rounded-lg p-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Available</div>
              <div className="text-sm text-gx-green font-medium">{formatBytes(memory.available)}</div>
            </div>
            <div className="bg-gx-border/30 rounded-lg p-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Buffers</div>
              <div className="text-sm text-gx-yellow font-medium">{formatBytes(memory.buffers)}</div>
            </div>
            <div className="bg-gx-border/30 rounded-lg p-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Cached</div>
              <div className="text-sm text-gx-cyan font-medium">{formatBytes(memory.cached)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
