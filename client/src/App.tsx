import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { SettingsPage } from './components/SettingsPage';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { fetchApi } from './hooks/useFetch';
import type { FullStatus } from './types';

type ViewType = 'dashboard' | 'settings';

// Initialize theme before React renders to prevent flash
function initializeTheme() {
  const stored = localStorage.getItem('gx10-theme');
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.setAttribute('data-theme', stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// Run immediately
initializeTheme();

function App() {
  const { setStatus, setError } = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Connect to WebSocket for real-time updates
  useWebSocket();

  // Fetch initial full status
  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const status = await fetchApi<FullStatus>('/api/status');
        setStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial status');
      }
    };

    fetchInitialStatus();

    // Refresh full status every 30 seconds (for data not in real-time metrics)
    const interval = setInterval(fetchInitialStatus, 30000);

    return () => clearInterval(interval);
  }, [setStatus, setError]);

  if (currentView === 'settings') {
    return <SettingsPage onBack={() => setCurrentView('dashboard')} />;
  }

  return <Dashboard onOpenSettings={() => setCurrentView('settings')} />;
}

export default App;
