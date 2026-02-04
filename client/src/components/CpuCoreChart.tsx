import { useState, useEffect, useCallback } from 'react';
import type { CpuCore } from '../types';

// Mock data for development - replace with actual API calls
const generateMockCores = (count: number): CpuCore[] => {
  return Array.from({ length: count }, (_, i) => ({
    core: i,
    usage: Math.random() * 100,
    frequency: 2400 + Math.random() * 1600,
  }));
};

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'bg-gx-red';
  if (percentage >= 70) return 'bg-gx-yellow';
  if (percentage >= 50) return 'bg-gx-cyan';
  return 'bg-gx-green';
}

function getUsageGradient(percentage: number): string {
  if (percentage >= 90) return 'from-gx-red to-gx-red/70';
  if (percentage >= 70) return 'from-gx-yellow to-gx-yellow/70';
  if (percentage >= 50) return 'from-gx-cyan to-gx-cyan/70';
  return 'from-gx-green to-gx-green/70';
}

interface CpuCoreChartProps {
  showFrequency?: boolean;
  compact?: boolean;
}

export function CpuCoreChart({ showFrequency = false, compact = false }: CpuCoreChartProps) {
  const [cores, setCores] = useState<CpuCore[]>([]);
  const [hoveredCore, setHoveredCore] = useState<number | null>(null);

  const fetchCores = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/cpu/cores');
      // const data = await response.json();
      // setCores(data);

      // Mock data - 24 cores for visualization
      setCores(generateMockCores(24));
    } catch (error) {
      console.error('Failed to fetch CPU cores:', error);
    }
  }, []);

  useEffect(() => {
    fetchCores();
    const interval = setInterval(fetchCores, 2000);
    return () => clearInterval(interval);
  }, [fetchCores]);

  // Calculate grid columns based on core count
  const getGridCols = (coreCount: number): string => {
    if (coreCount <= 4) return 'grid-cols-2';
    if (coreCount <= 8) return 'grid-cols-4';
    if (coreCount <= 16) return 'grid-cols-4 sm:grid-cols-8';
    return 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8';
  };

  const avgUsage = cores.length > 0
    ? cores.reduce((sum, c) => sum + c.usage, 0) / cores.length
    : 0;

  const maxUsage = cores.length > 0
    ? Math.max(...cores.map(c => c.usage))
    : 0;

  if (cores.length === 0) {
    return (
      <div className={compact ? 'card-compact' : 'card'}>
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>CPU Cores</span>
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          Loading CPU cores...
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'card-compact' : 'card'}>
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        <span>CPU Cores ({cores.length})</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="text-gray-400">
            Avg: <span className={getUsageColor(avgUsage).replace('bg-', 'text-')}>{avgUsage.toFixed(1)}%</span>
          </span>
          <span className="text-gray-400">
            Max: <span className={getUsageColor(maxUsage).replace('bg-', 'text-')}>{maxUsage.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* Core Grid */}
      <div className={`grid ${getGridCols(cores.length)} gap-1`}>
        {cores.map((core) => (
          <div
            key={core.core}
            className="relative group"
            onMouseEnter={() => setHoveredCore(core.core)}
            onMouseLeave={() => setHoveredCore(null)}
          >
            {/* Bar Container */}
            <div className="h-8 bg-gx-border rounded overflow-hidden relative">
              {/* Usage Bar */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getUsageGradient(core.usage)} transition-all duration-300`}
                style={{ height: `${Math.min(core.usage, 100)}%` }}
              />
              {/* Core Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-medium text-white/80 drop-shadow-lg">
                  {core.core}
                </span>
              </div>
            </div>

            {/* Tooltip */}
            {hoveredCore === core.core && (
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gx-dark border border-gx-border rounded shadow-lg whitespace-nowrap">
                <div className="text-xs">
                  <div className="font-medium text-white">Core {core.core}</div>
                  <div className={`${getUsageColor(core.usage).replace('bg-', 'text-')}`}>
                    {core.usage.toFixed(1)}%
                  </div>
                  {showFrequency && (
                    <div className="text-gray-400">
                      {(core.frequency / 1000).toFixed(2)} GHz
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-gx-green" />
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-gx-cyan" />
          <span>50-70%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-gx-yellow" />
          <span>70-90%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-gx-red" />
          <span>&gt;90%</span>
        </div>
      </div>
    </div>
  );
}
