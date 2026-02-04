import { useState, useRef, useEffect, useCallback } from 'react';
import { useMetricsDB, type MetricsStats } from '../hooks/useMetricsDB';

interface ExportButtonProps {
  className?: string;
}

type ExportFormat = 'json' | 'csv';
type DatePreset = 'all' | '1h' | '6h' | '24h' | 'custom';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton({ className = '' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stats, setStats] = useState<MetricsStats | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { exportMetrics, getStats, clearAllMetrics } = useMetricsDB();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch stats when dropdown opens
  useEffect(() => {
    if (isOpen) {
      getStats().then(setStats);
    }
  }, [isOpen, getStats]);

  // Auto-hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  }, []);

  const getDateRange = useCallback((): { start?: Date; end?: Date } => {
    const now = new Date();

    switch (datePreset) {
      case '1h':
        return { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
      case '6h':
        return { start: new Date(now.getTime() - 6 * 60 * 60 * 1000), end: now };
      case '24h':
        return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : undefined,
          end: customEndDate ? new Date(customEndDate) : undefined,
        };
      default:
        return {};
    }
  }, [datePreset, customStartDate, customEndDate]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      try {
        const { start, end } = getDateRange();
        const data = await exportMetrics(format, start, end);

        if (!data || data.length === 0) {
          showToast('No data available for export', 'error');
          return;
        }

        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `gx10-metrics-${dateStr}.${format}`;
        const mimeType = format === 'json' ? 'application/json' : 'text/csv';

        downloadFile(data, filename, mimeType);
        showToast(`Exported ${filename} successfully`, 'success');
        setIsOpen(false);
      } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed. Please try again.', 'error');
      } finally {
        setIsExporting(false);
      }
    },
    [exportMetrics, getDateRange, showToast]
  );

  const handleClearData = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all historical data? This cannot be undone.')) {
      return;
    }

    setIsExporting(true);
    try {
      const success = await clearAllMetrics();
      if (success) {
        showToast('Historical data cleared', 'success');
        setStats(null);
        setIsOpen(false);
      } else {
        showToast('Failed to clear data', 'error');
      }
    } catch (error) {
      console.error('Clear failed:', error);
      showToast('Failed to clear data', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [clearAllMetrics, showToast]);

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-opacity ${
            toast.type === 'success'
              ? 'bg-gx-green/20 border border-gx-green/50 text-gx-green'
              : 'bg-gx-red/20 border border-gx-red/50 text-gx-red'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          aria-label="Export data"
          aria-expanded={isOpen}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="text-xs hidden sm:inline">Export</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-gx-card border border-gx-border rounded-lg shadow-xl z-50">
            <div className="p-3">
              <h3 className="text-sm font-medium text-white mb-2">Export Metrics</h3>

              {/* Stats */}
              {stats && stats.count > 0 && (
                <div className="mb-3 p-2 bg-gx-dark/50 rounded-lg text-xs text-gray-400">
                  <div className="flex justify-between mb-1">
                    <span>Records:</span>
                    <span className="text-white">{stats.count.toLocaleString()}</span>
                  </div>
                  {stats.oldest && (
                    <div className="flex justify-between mb-1">
                      <span>Oldest:</span>
                      <span>{new Date(stats.oldest).toLocaleString()}</span>
                    </div>
                  )}
                  {stats.newest && (
                    <div className="flex justify-between">
                      <span>Newest:</span>
                      <span>{new Date(stats.newest).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* No data message */}
              {stats && stats.count === 0 && (
                <div className="mb-3 p-2 bg-gx-dark/50 rounded-lg text-xs text-gray-500 text-center">
                  No historical data available
                </div>
              )}

              {/* Date Range Selector */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">Date Range</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                  className="w-full bg-gx-dark border border-gx-border rounded-lg px-2 py-1.5 text-sm text-white"
                >
                  <option value="all">All Data</option>
                  <option value="1h">Last 1 Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {datePreset === 'custom' && (
                <div className="mb-3 space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={formatDate(new Date())}
                      className="w-full bg-gx-dark border border-gx-border rounded-lg px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      max={formatDate(new Date())}
                      className="w-full bg-gx-dark border border-gx-border rounded-lg px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                </div>
              )}

              {/* Export Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting || (stats?.count ?? 0) === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gx-cyan/20 hover:bg-gx-cyan/30 text-gx-cyan rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <svg
                      className="w-4 h-4 animate-spin"
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
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  Export as JSON
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting || (stats?.count ?? 0) === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gx-green/20 hover:bg-gx-green/30 text-gx-green rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <svg
                      className="w-4 h-4 animate-spin"
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
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                  Export as CSV
                </button>
              </div>

              {/* Clear Data */}
              <div className="mt-3 pt-3 border-t border-gx-border">
                <button
                  onClick={handleClearData}
                  disabled={isExporting || (stats?.count ?? 0) === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gx-red hover:bg-gx-red/10 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
