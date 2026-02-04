import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { SettingsPage } from './components/SettingsPage';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { fetchApi } from './hooks/useFetch';
import type { FullStatus } from './types';

type ViewType = 'dashboard' | 'settings';

// Initialize theme before React renders to prevent flash
// Force dark theme for GX10 system monitoring dashboard
function initializeTheme() {
  // Always use dark theme - migrate any old 'light' setting
  localStorage.setItem('gx10-theme', 'dark');
  document.documentElement.setAttribute('data-theme', 'dark');
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

    // Refresh full status every 60 seconds (optimized for occasional monitoring)
    const interval = setInterval(fetchInitialStatus, 60000);

    return () => clearInterval(interval);
  }, [setStatus, setError]);

  if (currentView === 'settings') {
    return <SettingsPage onBack={() => setCurrentView('dashboard')} />;
  }

  return <Dashboard onOpenSettings={() => setCurrentView('settings')} />;
}

export default App;
