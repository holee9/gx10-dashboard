import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceLine,
} from 'recharts';
import { useMetricsDB, type MetricsRecord } from '../hooks/useMetricsDB';

type TimeRange = '1m' | '5m' | '1h' | '24h';

interface HistoryChartProps {
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  defaultExpanded?: boolean;
}

interface ChartData {
  time: string;
  fullTime: string;
  cpu: number;
  memory: number;
  gpu: number | null;
  gpuTemp: number | null;
}

interface MetricsStatistics {
  cpu: { min: number; max: number; avg: number; trend: number };
  memory: { min: number; max: number; avg: number; trend: number };
  gpu: { min: number; max: number; avg: number; trend: number } | null;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1m', label: '1 Min' },
  { value: '5m', label: '5 Min' },
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
];

function formatTime(timestamp: string, range: TimeRange): string {
  const date = new Date(timestamp);
  if (range === '24h') {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatFullTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour12: false,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function calculateStatistics(data: ChartData[]): MetricsStatistics | null {
  if (data.length === 0) return null;

  const cpuValues = data.map((d) => d.cpu);
  const memoryValues = data.map((d) => d.memory);
  const gpuValues = data.filter((d) => d.gpu !== null).map((d) => d.gpu as number);

  const calcStats = (values: number[]) => {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, trend: 0 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate trend (compare first half vs second half average)
    const halfLength = Math.floor(values.length / 2);
    if (halfLength > 0) {
      const firstHalfAvg =
        values.slice(0, halfLength).reduce((a, b) => a + b, 0) / halfLength;
      const secondHalfAvg =
        values.slice(halfLength).reduce((a, b) => a + b, 0) /
        (values.length - halfLength);
      const trend = secondHalfAvg - firstHalfAvg;
      return { min, max, avg, trend };
    }

    return { min, max, avg, trend: 0 };
  };

  return {
    cpu: calcStats(cpuValues),
    memory: calcStats(memoryValues),
    gpu: gpuValues.length > 0 ? calcStats(gpuValues) : null,
  };
}

function TrendIndicator({ value, label }: { value: number; label: string }) {
  const isUp = value > 0.5;
  const isDown = value < -0.5;
  const color = isUp ? 'text-gx-red' : isDown ? 'text-gx-green' : 'text-gray-500';

  return (
    <span className={`flex items-center gap-0.5 ${color}`} title={`${label} trend`}>
      {isUp && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
      {isDown && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {!isUp && !isDown && <span className="text-xs">-</span>}
      <span className="text-xs">{Math.abs(value).toFixed(1)}%</span>
    </span>
  );
}

function StatCard({
  label,
  color,
  stats,
}: {
  label: string;
  color: string;
  stats: { min: number; max: number; avg: number; trend: number };
}) {
  return (
    <div className="bg-gx-dark/50 rounded-lg p-2 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className={color}>{label}</span>
        <TrendIndicator value={stats.trend} label={label} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-gray-400">
        <div>
          <span className="text-gray-500">Min:</span> {stats.min.toFixed(1)}%
        </div>
        <div>
          <span className="text-gray-500">Avg:</span> {stats.avg.toFixed(1)}%
        </div>
        <div>
          <span className="text-gray-500">Max:</span> {stats.max.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export function HistoryChart({
  timeRange: externalTimeRange,
  onTimeRangeChange,
  defaultExpanded = false,
}: HistoryChartProps) {
  const [internalTimeRange, setInternalTimeRange] = useState<TimeRange>('5m');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<MetricsRecord[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const { getMetrics } = useMetricsDB();

  const timeRange = externalTimeRange ?? internalTimeRange;

  const handleTimeRangeChange = useCallback(
    (newRange: TimeRange) => {
      if (onTimeRangeChange) {
        onTimeRangeChange(newRange);
      } else {
        setInternalTimeRange(newRange);
      }
    },
    [onTimeRangeChange]
  );

  // Fetch historical data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMetrics(timeRange);
      setHistoricalData(data);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getMetrics, timeRange]);

  // Initial fetch and refresh on time range change
  useEffect(() => {
    if (isExpanded) {
      fetchData();
    }
  }, [isExpanded, timeRange, fetchData]);

  // Auto-refresh every 10 seconds when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, [isExpanded, fetchData]);

  const chartData = useMemo<ChartData[]>(() => {
    // Downsample for large datasets
    let data = historicalData;
    const maxPoints = timeRange === '24h' ? 500 : timeRange === '1h' ? 300 : 100;

    if (data.length > maxPoints) {
      const step = Math.ceil(data.length / maxPoints);
      data = data.filter((_, i) => i % step === 0);
    }

    return data.map((m) => ({
      time: formatTime(m.timestamp, timeRange),
      fullTime: formatFullTime(m.timestamp),
      cpu: m.cpu,
      memory: m.memory,
      gpu: m.gpu,
      gpuTemp: m.gpuTemp,
    }));
  }, [historicalData, timeRange]);

  const statistics = useMemo(() => calculateStatistics(chartData), [chartData]);
  const hasGpuData = chartData.some((d) => d.gpu !== null);

  if (!isExpanded) {
    return (
      <div className="card">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left"
          aria-label="Expand history chart"
        >
          <div className="card-header mb-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Historical Data</span>
          </div>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(false)}
          className="card-header mb-0 hover:text-white transition-colors"
          aria-label="Collapse history chart"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Historical Data</span>
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {/* Refresh indicator */}
          {lastFetchTime > 0 && (
            <span className="text-xs text-gray-500">
              Updated {new Date(lastFetchTime).toLocaleTimeString()}
            </span>
          )}

          {/* Time Range Selector */}
          <div className="flex bg-gx-dark rounded-lg p-0.5">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeRangeChange(option.value)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  timeRange === option.value
                    ? 'bg-gx-purple/20 text-gx-purple'
                    : 'text-gray-400 hover:text-white'
                }`}
                aria-label={`Show ${option.label} of data`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
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

      {/* Statistics Row */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          <StatCard label="CPU" color="text-gx-cyan" stats={statistics.cpu} />
          <StatCard label="Memory" color="text-gx-green" stats={statistics.memory} />
          {statistics.gpu && (
            <StatCard label="GPU" color="text-gx-purple" stats={statistics.gpu} />
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && chartData.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <svg
              className="w-6 h-6 mx-auto mb-1 animate-spin"
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
            <p className="text-xs">Loading historical data...</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && chartData.length < 2 && (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <svg
              className="w-6 h-6 mx-auto mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-xs">
              No historical data available for this time range.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Data will be collected automatically.
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="time"
                stroke="#6e7681"
                tick={{ fill: '#6e7681', fontSize: 10 }}
                tickLine={{ stroke: '#30363d' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6e7681"
                tick={{ fill: '#6e7681', fontSize: 10 }}
                tickLine={{ stroke: '#30363d' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                labelStyle={{ color: '#6e7681' }}
                labelFormatter={(_, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullTime;
                  }
                  return '';
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '8px', fontSize: '10px' }}
                formatter={(value) => (
                  <span style={{ color: '#8b949e', fontSize: '10px' }}>{value}</span>
                )}
              />

              {/* Reference lines for thresholds */}
              <ReferenceLine
                y={80}
                stroke="#d29922"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={90}
                stroke="#f85149"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              <Line
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="#00d9ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                name="Memory"
                stroke="#3fb950"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {hasGpuData && (
                <Line
                  type="monotone"
                  dataKey="gpu"
                  name="GPU"
                  stroke="#a371f7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}

              {/* Brush for zoom/pan */}
              <Brush
                dataKey="time"
                height={20}
                stroke="#30363d"
                fill="#161b22"
                tickFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data info */}
      {chartData.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{chartData.length} data points</span>
          <span>Drag chart area to zoom, drag brush to pan</span>
        </div>
      )}
    </div>
  );
}
