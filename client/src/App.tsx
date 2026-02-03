import { useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { fetchApi } from './hooks/useFetch';
import type { FullStatus } from './types';

function App() {
  const { setStatus, setError } = useStore();

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

  return <Dashboard />;
}

export default App;
