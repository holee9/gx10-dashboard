import { SystemCard } from './SystemCard';
import { GpuCard } from './GpuCard';
import { BrainCard } from './BrainCard';
import { OllamaCard } from './OllamaCard';
import { VisionCard } from './VisionCard';
import { StorageCard } from './StorageCard';
import { NetworkCard } from './NetworkCard';
import { MetricsChart } from './MetricsChart';
import { useStore } from '../store/useStore';

export function Dashboard() {
  const { connected, lastUpdate, error, status } = useStore();
  const currentBrain = status?.brain?.active || 'code';

  return (
    <div className="min-h-screen bg-gx-dark">
      {/* Header - Compact */}
      <header className="border-b border-gx-border bg-gx-card">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-gx-cyan to-gx-purple bg-clip-text text-transparent">
                GX10
              </div>
              <div className="text-gray-400 text-xs">System Dashboard</div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-gx-green animate-pulse' : 'bg-gx-red'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {connected ? 'Live' : 'Disconnected'}
                </span>
              </div>

              {/* Last Update */}
              {lastUpdate && (
                <div className="text-xs text-gray-500">
                  {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-gx-red/10 border-b border-gx-red/30 px-4 py-1">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-gx-red text-xs">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Main Content - Compact */}
      <main className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column - System Stats */}
          <div className="lg:col-span-2 space-y-3">
            {/* System & GPU Row */}
            <div className="grid grid-cols-2 gap-3">
              <SystemCard />
              <GpuCard />
            </div>
            {/* Storage & Network Row */}
            <div className="grid grid-cols-2 gap-3">
              <StorageCard />
              <NetworkCard />
            </div>
            {/* Chart */}
            <MetricsChart />
          </div>

          {/* Right Column - Brain & AI Backend */}
          <div className="space-y-3">
            <BrainCard />
            {currentBrain === 'code' ? <OllamaCard /> : <VisionCard />}
          </div>
        </div>
      </main>

      {/* Footer - Compact */}
      <footer className="border-t border-gx-border bg-gx-card">
        <div className="max-w-7xl mx-auto px-4 py-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>GX10 Dashboard v1.0.0</div>
            <div className="flex items-center gap-3">
              <a
                href="/api/status"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gx-cyan transition-colors"
              >
                API
              </a>
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gx-cyan transition-colors"
              >
                Health
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
