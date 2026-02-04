import { useState, useEffect, useCallback, memo } from 'react';
import { SystemCard } from './SystemCard';
import { GpuCard } from './GpuCard';
import { BrainCard } from './BrainCard';
import { OllamaCard } from './OllamaCard';
import { VisionCard } from './VisionCard';
import { StorageCard } from './StorageCard';
import { NetworkCard } from './NetworkCard';
import { MetricsChart } from './MetricsChart';
import { HistoryChart } from './HistoryChart';
import { AlertPanel } from './AlertPanel';
import { ProcessList } from './ProcessList';
import { CpuCoreChart } from './CpuCoreChart';
import { MemoryDetailCard } from './MemoryDetailCard';
import { ExportButton } from './ExportButton';
import { ThemeToggle, useTheme } from './ThemeToggle';
import { useKeyboardShortcuts, ShortcutsHelpModal, type DashboardTab } from '../hooks/useKeyboardShortcuts';
import { useStore } from '../store/useStore';
import { fetchApi } from '../hooks/useFetch';
import type { FullStatus } from '../types';

interface DashboardProps {
  onOpenSettings?: () => void;
}

const TAB_STORAGE_KEY = 'gx10-active-tab';

function getInitialTab(): DashboardTab {
  // Check URL hash first
  const hash = window.location.hash.slice(1);
  if (['overview', 'performance', 'storage', 'network'].includes(hash)) {
    return hash as DashboardTab;
  }

  // Check localStorage
  const stored = localStorage.getItem(TAB_STORAGE_KEY);
  if (stored && ['overview', 'performance', 'storage', 'network'].includes(stored)) {
    return stored as DashboardTab;
  }

  return 'overview';
}

// Tab icons - memoized for performance
const OverviewIcon = memo(function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
});

const PerformanceIcon = memo(function PerformanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
});

const StorageIcon = memo(function StorageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );
});

const NetworkIcon = memo(function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
});

interface TabItem {
  id: DashboardTab;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', shortcut: '1', icon: OverviewIcon },
  { id: 'performance', label: 'Performance', shortcut: '2', icon: PerformanceIcon },
  { id: 'storage', label: 'Storage', shortcut: '3', icon: StorageIcon },
  { id: 'network', label: 'Network', shortcut: '4', icon: NetworkIcon },
];

export function Dashboard({ onOpenSettings }: DashboardProps) {
  const { connected, lastUpdate, error, status, initPersistence, setStatus, setError } = useStore();
  const currentBrain = status?.brain?.active || 'code';
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>(getInitialTab);
  const { toggleTheme } = useTheme();

  // Handle tab change with URL hash and localStorage persistence
  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  }, []);

  // Handle data refresh
  const handleRefresh = useCallback(async () => {
    try {
      const freshStatus = await fetchApi<FullStatus>('/api/status');
      setStatus(freshStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  }, [setStatus, setError]);

  // Keyboard shortcuts
  const { showHelp, closeHelp } = useKeyboardShortcuts({
    onTabChange: handleTabChange,
    onRefresh: handleRefresh,
    onToggleAdvanced: () => setShowAdvanced((prev) => !prev),
    onOpenSettings,
    onToggleTheme: toggleTheme,
    enabled: true,
  });

  // Initialize IndexedDB persistence on mount
  useEffect(() => {
    initPersistence();
  }, [initPersistence]);

  // Sync with URL hash on popstate
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (['overview', 'performance', 'storage', 'network'].includes(hash)) {
        setActiveTab(hash as DashboardTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-themed-primary transition-colors duration-300">
      {/* Header - Compact */}
      <header className="border-b border-themed bg-themed-card transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-gx-cyan to-gx-purple bg-clip-text text-transparent">
                GX10
              </div>
              <div className="text-themed-secondary text-xs hidden sm:block">System Dashboard</div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-gx-green animate-pulse' : 'bg-gx-red'
                  }`}
                />
                <span className="text-xs text-themed-secondary hidden sm:inline">
                  {connected ? 'Live' : 'Disconnected'}
                </span>
              </div>

              {/* Last Update */}
              {lastUpdate && (
                <div className="text-xs text-themed-muted hidden md:block">
                  {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors"
                aria-label="Refresh data (R)"
                title="Refresh data (R)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Advanced View Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors hidden sm:block ${
                  showAdvanced
                    ? 'bg-gx-purple/20 text-gx-purple'
                    : 'text-gray-400 hover:text-white hover:bg-gx-border/50'
                }`}
                aria-label="Toggle advanced view (A)"
                title="Toggle advanced view (A)"
              >
                Advanced
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Export Button */}
              <ExportButton />

              {/* Settings Button */}
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors"
                  aria-label="Open settings (S)"
                  title="Open settings (S)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}

              {/* Help Button */}
              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: '?' });
                  document.dispatchEvent(event);
                }}
                className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors hidden sm:block"
                aria-label="Keyboard shortcuts (?)"
                title="Keyboard shortcuts (?)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-themed bg-themed-card/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="tab-bar my-2" role="tablist" aria-label="Dashboard sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 tab-icon" />
                  <span>{tab.label}</span>
                  <span className="kbd hidden lg:inline-flex">{tab.shortcut}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

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

      {/* Alert Panel */}
      <AlertPanel />

      {/* Main Content - Tab Panels */}
      <main className="max-w-7xl mx-auto px-4 py-3">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div
            id="overview-panel"
            role="tabpanel"
            aria-labelledby="overview-tab"
            className="grid grid-cols-1 lg:grid-cols-3 gap-3"
          >
            {/* Left Column - System Stats */}
            <div className="lg:col-span-2 space-y-3">
              {/* System & GPU Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SystemCard />
                <GpuCard />
              </div>
              {/* Storage & Network Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StorageCard />
                <NetworkCard />
              </div>
              {/* Real-time Chart */}
              <MetricsChart />

              {/* Historical Data Chart */}
              <HistoryChart />
            </div>

            {/* Right Column - Brain & AI Backend */}
            <div className="space-y-3">
              <BrainCard />
              {currentBrain === 'code' ? <OllamaCard /> : <VisionCard />}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div
            id="performance-panel"
            role="tabpanel"
            aria-labelledby="performance-tab"
            className="space-y-3"
          >
            {/* System Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SystemCard />
              <GpuCard />
            </div>

            {/* CPU Cores */}
            <CpuCoreChart showFrequency />

            {/* Memory Details */}
            <MemoryDetailCard expanded />

            {/* Real-time Charts */}
            <MetricsChart />

            {/* Process List */}
            <ProcessList />
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div
            id="storage-panel"
            role="tabpanel"
            aria-labelledby="storage-tab"
            className="space-y-3"
          >
            {/* Storage Overview - Full Width */}
            <StorageCard />

            {/* Memory Details */}
            <MemoryDetailCard expanded />

            {/* Historical Data */}
            <HistoryChart />
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div
            id="network-panel"
            role="tabpanel"
            aria-labelledby="network-tab"
            className="space-y-3"
          >
            {/* Network Overview - Full Width */}
            <NetworkCard />

            {/* Real-time Metrics */}
            <MetricsChart />

            {/* Historical Data */}
            <HistoryChart />
          </div>
        )}

        {/* Advanced Monitoring Section - Shows on all tabs when enabled */}
        {showAdvanced && activeTab === 'overview' && (
          <div className="mt-3 space-y-3">
            {/* CPU Cores & Memory Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <CpuCoreChart showFrequency />
              <MemoryDetailCard expanded />
            </div>

            {/* Process List */}
            <ProcessList />
          </div>
        )}
      </main>

      {/* Footer - Compact */}
      <footer className="border-t border-themed bg-themed-card transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-1.5">
          <div className="flex items-center justify-between text-xs text-themed-secondary">
            <div>GX10 Dashboard v2.0.0</div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-themed-muted">
                Press <span className="kbd">?</span> for shortcuts
              </span>
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

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal isOpen={showHelp} onClose={closeHelp} />
    </div>
  );
}
