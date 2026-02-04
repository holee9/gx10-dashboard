import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '../store/useStore';

interface ChartData {
  time: string;
  cpu: number;
  memory: number;
  gpu: number | null;
  networkRx: number;
  networkTx: number;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatNetworkSpeed(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(1)} Gbps`;
  }
  return `${mbps.toFixed(1)} Mbps`;
}

export function MetricsChart() {
  const { metricsHistory } = useStore();
  const [showNetwork, setShowNetwork] = useState(true);

  const chartData = useMemo<ChartData[]>(() => {
    return metricsHistory.map((m) => ({
      time: formatTime(m.timestamp),
      cpu: m.cpu,
      memory: m.memory,
      gpu: m.gpu,
      networkRx: m.networkRx,
      networkTx: m.networkTx,
    }));
  }, [metricsHistory]);

  // Get max network value for scaling
  const maxNetwork = useMemo(() => {
    const max = Math.max(
      ...metricsHistory.map((m) => Math.max(m.networkRx, m.networkTx)),
      1 // minimum 1 to avoid division by zero
    );
    // Round up to nearest nice number
    if (max <= 10) return 10;
    if (max <= 100) return Math.ceil(max / 10) * 10;
    if (max <= 1000) return Math.ceil(max / 100) * 100;
    return Math.ceil(max / 1000) * 1000;
  }, [metricsHistory]);

  // Latest network speeds
  const latestRx = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].networkRx : 0;
  const latestTx = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].networkTx : 0;

  if (chartData.length < 2) {
    return (
      <div className="card">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <span>Resource Usage Over Time</span>
        </div>
        <div className="flex items-center justify-center h-28 text-themed-muted">
          <div className="text-center">
            <svg className="w-6 h-6 mx-auto mb-1 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs">Collecting data...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasGpuData = chartData.some((d) => d.gpu !== null);
  const hasNetworkData = chartData.some((d) => d.networkRx > 0 || d.networkTx > 0);

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span>Resource Usage Over Time</span>
        <span className="ml-auto text-xs text-themed-muted">Last 2 minutes</span>
      </div>

      {/* Network toggle and current speeds */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => setShowNetwork(!showNetwork)}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            showNetwork
              ? 'bg-gx-yellow/20 text-gx-yellow'
              : 'text-themed-muted hover:text-themed-secondary'
          }`}
        >
          Network {showNetwork ? 'ON' : 'OFF'}
        </button>
        {showNetwork && hasNetworkData && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gx-cyan">
              ↓ {formatNetworkSpeed(latestRx)}
            </span>
            <span className="text-gx-yellow">
              ↑ {formatNetworkSpeed(latestTx)}
            </span>
          </div>
        )}
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: showNetwork ? 40 : 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="time"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={{ stroke: 'var(--border-color)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="percent"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={{ stroke: 'var(--border-color)' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            {showNetwork && (
              <YAxis
                yAxisId="network"
                orientation="right"
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                tickLine={{ stroke: 'var(--border-color)' }}
                domain={[0, maxNetwork]}
                tickFormatter={(value) => value >= 1000 ? `${value/1000}G` : `${value}M`}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              labelStyle={{ color: 'var(--text-muted)' }}
              formatter={(value: number, name: string) => {
                if (name === 'Net ↓' || name === 'Net ↑') {
                  return [formatNetworkSpeed(value), name];
                }
                return [`${value.toFixed(1)}%`, name];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '2px', fontSize: '10px' }}
              formatter={(value) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{value}</span>
              )}
            />
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="cpu"
              name="CPU"
              stroke="#00b8d9"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="memory"
              name="Memory"
              stroke="#2da44e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {hasGpuData && (
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="gpu"
                name="GPU"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            )}
            {showNetwork && (
              <>
                <Line
                  yAxisId="network"
                  type="monotone"
                  dataKey="networkRx"
                  name="Net ↓"
                  stroke="#00b8d9"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Line
                  yAxisId="network"
                  type="monotone"
                  dataKey="networkTx"
                  name="Net ↑"
                  stroke="#bf8700"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
