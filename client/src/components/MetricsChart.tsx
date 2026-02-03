import { useMemo } from 'react';
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

export function MetricsChart() {
  const { metricsHistory } = useStore();

  const chartData = useMemo<ChartData[]>(() => {
    return metricsHistory.map((m) => ({
      time: formatTime(m.timestamp),
      cpu: m.cpu,
      memory: m.memory,
      gpu: m.gpu,
    }));
  }, [metricsHistory]);

  if (chartData.length < 2) {
    return (
      <div className="card">
        <div className="card-header">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <span>Resource Usage Over Time</span>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Collecting data...</p>
            <p className="text-sm">Chart will appear shortly</p>
          </div>
        </div>
      </div>
    );
  }

  const hasGpuData = chartData.some((d) => d.gpu !== null);

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span>Resource Usage Over Time</span>
        <span className="ml-auto text-xs text-gray-500">Last 2 minutes</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span style={{ color: '#8b949e' }}>{value}</span>
              )}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
