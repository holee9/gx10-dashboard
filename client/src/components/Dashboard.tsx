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
      {/* Header */}
      <header className="border-b border-gx-border bg-gx-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold bg-gradient-to-r from-gx-cyan to-gx-purple bg-clip-text text-transparent">
                GX10
              </div>
              <div className="text-gray-400 text-sm">System Dashboard</div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-gx-green animate-pulse' : 'bg-gx-red'
                  }`}
                />
                <span className="text-sm text-gray-400">
                  {connected ? 'Live' : 'Disconnected'}
                </span>
              </div>

              {/* Last Update */}
              {lastUpdate && (
                <div className="text-xs text-gray-500">
                  Updated: {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-gx-red/10 border-b border-gx-red/30 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-gx-red text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - System, GPU & Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <SystemCard />
            <GpuCard />
            <MetricsChart />
            {/* Storage & Network Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StorageCard />
              <NetworkCard />
            </div>
          </div>

          {/* Right Column - Brain & AI Backend */}
          <div className="space-y-6">
            <BrainCard />
            {currentBrain === 'code' ? <OllamaCard /> : <VisionCard />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gx-border bg-gx-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>GX10 Dashboard v1.0.0</div>
            <div className="flex items-center gap-4">
              <a
                href="/api/status"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gx-cyan transition-colors"
              >
                API Status
              </a>
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gx-cyan transition-colors"
              >
                Health Check
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
