import { useState, useEffect, useCallback } from 'react';
import type { GpuProcess, TopProcess } from '../types';

type TabType = 'gpu' | 'cpu' | 'memory';
type SortField = 'pid' | 'name' | 'gpuMemory' | 'gpuUtil' | 'memUtil' | 'cpuPercent' | 'memPercent' | 'memoryMB' | 'user';
type SortDirection = 'asc' | 'desc';

// Mock data for development - replace with actual API calls
const mockGpuProcesses: GpuProcess[] = [
  { pid: 1234, processName: 'python3', gpuMemoryUsed: 4096, gpuUtilization: 85, memUtilization: 12, type: 'C' },
  { pid: 5678, processName: 'ollama', gpuMemoryUsed: 8192, gpuUtilization: 45, memUtilization: 8, type: 'C' },
  { pid: 9012, processName: 'Xorg', gpuMemoryUsed: 256, gpuUtilization: 5, memUtilization: 2, type: 'G' },
];

const mockTopProcesses: TopProcess[] = [
  { pid: 1234, name: 'python3', cpuPercent: 85.2, memPercent: 12.5, memoryMB: 2048, user: 'holee' },
  { pid: 5678, name: 'ollama', cpuPercent: 45.1, memPercent: 8.3, memoryMB: 1356, user: 'holee' },
  { pid: 1001, name: 'chromium', cpuPercent: 12.3, memPercent: 25.6, memoryMB: 4192, user: 'holee' },
  { pid: 2002, name: 'code', cpuPercent: 8.5, memPercent: 15.2, memoryMB: 2480, user: 'holee' },
  { pid: 3003, name: 'node', cpuPercent: 5.2, memPercent: 4.8, memoryMB: 784, user: 'holee' },
];

function getUsageColor(percentage: number): string {
  if (percentage >= 80) return 'text-gx-red';
  if (percentage >= 50) return 'text-gx-yellow';
  return 'text-gx-green';
}

function formatMemory(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortableHeader({ label, field, currentSort, direction, onSort, className = '' }: SortableHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      className={`px-2 py-1.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
            />
          </svg>
        )}
      </div>
    </th>
  );
}

export function ProcessList() {
  const [activeTab, setActiveTab] = useState<TabType>('gpu');
  const [gpuProcesses, setGpuProcesses] = useState<GpuProcess[]>(mockGpuProcesses);
  const [topProcesses, setTopProcesses] = useState<TopProcess[]>(mockTopProcesses);
  const [sortField, setSortField] = useState<SortField>('gpuUtil');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchProcesses = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // TODO: Replace with actual API calls
      // const gpuResponse = await fetch('/api/processes/gpu');
      // const cpuResponse = await fetch('/api/processes/top');
      // setGpuProcesses(await gpuResponse.json());
      // setTopProcesses(await cpuResponse.json());

      // Simulate API delay and update with slightly varied mock data
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update GPU processes with slight variations
      setGpuProcesses(mockGpuProcesses.map(p => ({
        ...p,
        gpuUtilization: Math.max(0, Math.min(100, p.gpuUtilization + (Math.random() - 0.5) * 10)),
        memUtilization: Math.max(0, Math.min(100, p.memUtilization + (Math.random() - 0.5) * 5)),
      })));

      // Update top processes with slight variations
      setTopProcesses(mockTopProcesses.map(p => ({
        ...p,
        cpuPercent: Math.max(0, Math.min(100, p.cpuPercent + (Math.random() - 0.5) * 10)),
        memPercent: Math.max(0, Math.min(100, p.memPercent + (Math.random() - 0.5) * 5)),
      })));

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch processes:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedGpuProcesses = [...gpuProcesses].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'pid':
        comparison = a.pid - b.pid;
        break;
      case 'name':
        comparison = a.processName.localeCompare(b.processName);
        break;
      case 'gpuMemory':
        comparison = a.gpuMemoryUsed - b.gpuMemoryUsed;
        break;
      case 'gpuUtil':
        comparison = a.gpuUtilization - b.gpuUtilization;
        break;
      case 'memUtil':
        comparison = a.memUtilization - b.memUtilization;
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const sortedTopProcessesByCpu = [...topProcesses].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'pid':
        comparison = a.pid - b.pid;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'cpuPercent':
        comparison = a.cpuPercent - b.cpuPercent;
        break;
      case 'memoryMB':
        comparison = a.memoryMB - b.memoryMB;
        break;
      case 'user':
        comparison = a.user.localeCompare(b.user);
        break;
      default:
        comparison = a.cpuPercent - b.cpuPercent;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const sortedTopProcessesByMemory = [...topProcesses].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'pid':
        comparison = a.pid - b.pid;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'memoryMB':
        comparison = a.memoryMB - b.memoryMB;
        break;
      case 'memPercent':
        comparison = a.memPercent - b.memPercent;
        break;
      case 'user':
        comparison = a.user.localeCompare(b.user);
        break;
      default:
        comparison = a.memoryMB - b.memoryMB;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'gpu', label: 'GPU Processes' },
    { id: 'cpu', label: 'Top CPU' },
    { id: 'memory', label: 'Top Memory' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        {/* Tab Navigation */}
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Reset sort to appropriate default
                if (tab.id === 'gpu') setSortField('gpuUtil');
                else if (tab.id === 'cpu') setSortField('cpuPercent');
                else setSortField('memoryMB');
                setSortDirection('desc');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gx-cyan/20 text-gx-cyan'
                  : 'text-gray-400 hover:text-white hover:bg-gx-border/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchProcesses}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh processes"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Process Tables */}
      <div className="overflow-x-auto">
        {activeTab === 'gpu' && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gx-border">
                <SortableHeader label="PID" field="pid" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Name" field="name" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="GPU Memory" field="gpuMemory" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="GPU %" field="gpuUtil" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Mem %" field="memUtil" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody>
              {sortedGpuProcesses.map(process => (
                <tr key={process.pid} className="border-b border-gx-border/50 hover:bg-gx-border/20">
                  <td className="px-2 py-1.5 text-xs text-gray-300 font-mono">{process.pid}</td>
                  <td className="px-2 py-1.5 text-xs text-white truncate max-w-[120px]" title={process.processName}>
                    {process.processName}
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-300">{formatMemory(process.gpuMemoryUsed)}</td>
                  <td className={`px-2 py-1.5 text-xs font-medium ${getUsageColor(process.gpuUtilization)}`}>
                    {process.gpuUtilization}%
                  </td>
                  <td className={`px-2 py-1.5 text-xs font-medium ${getUsageColor(process.memUtilization)}`}>
                    {process.memUtilization}%
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`badge ${
                      process.type === 'C' ? 'badge-cyan' :
                      process.type === 'G' ? 'badge-purple' :
                      'badge-green'
                    }`}>
                      {process.type}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedGpuProcesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-gray-500 text-sm">
                    No GPU processes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'cpu' && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gx-border">
                <SortableHeader label="PID" field="pid" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Name" field="name" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="CPU %" field="cpuPercent" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Memory" field="memoryMB" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="User" field="user" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedTopProcessesByCpu.map(process => (
                <tr key={process.pid} className="border-b border-gx-border/50 hover:bg-gx-border/20">
                  <td className="px-2 py-1.5 text-xs text-gray-300 font-mono">{process.pid}</td>
                  <td className="px-2 py-1.5 text-xs text-white truncate max-w-[120px]" title={process.name}>
                    {process.name}
                  </td>
                  <td className={`px-2 py-1.5 text-xs font-medium ${getUsageColor(process.cpuPercent)}`}>
                    {process.cpuPercent.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-300">{formatMemory(process.memoryMB)}</td>
                  <td className="px-2 py-1.5 text-xs text-gray-400">{process.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'memory' && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gx-border">
                <SortableHeader label="PID" field="pid" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Name" field="name" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Memory" field="memoryMB" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Mem %" field="memPercent" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="User" field="user" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedTopProcessesByMemory.map(process => (
                <tr key={process.pid} className="border-b border-gx-border/50 hover:bg-gx-border/20">
                  <td className="px-2 py-1.5 text-xs text-gray-300 font-mono">{process.pid}</td>
                  <td className="px-2 py-1.5 text-xs text-white truncate max-w-[120px]" title={process.name}>
                    {process.name}
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-300">{formatMemory(process.memoryMB)}</td>
                  <td className={`px-2 py-1.5 text-xs font-medium ${getUsageColor(process.memPercent)}`}>
                    {process.memPercent.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-400">{process.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
