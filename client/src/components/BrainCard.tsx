import { useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchApi } from '../hooks/useFetch';

interface SwitchResponse {
  success: boolean;
  previous: string;
  current: string;
  duration_ms: number;
  error?: string;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function BrainCard() {
  const { status, metrics, updateBrainMode } = useStore();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMode = metrics?.brain.active ?? status?.brain.active ?? 'code';
  const brainUptime = status?.brain.uptime_seconds ?? 0;

  const handleSwitch = async (target: 'code' | 'vision') => {
    if (switching || target === currentMode) return;

    setSwitching(true);
    setError(null);

    try {
      const result = await fetchApi<SwitchResponse>('/api/brain/switch', {
        method: 'POST',
        body: JSON.stringify({ target }),
      });

      if (result.success) {
        updateBrainMode(target);
      } else {
        setError(result.error || 'Switch failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>Brain Mode</span>
        <span className="ml-auto text-xs text-gray-500">
          Active for {formatUptime(brainUptime)}
        </span>
      </div>

      {/* Current Mode Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <div className={`text-5xl mb-2 ${currentMode === 'code' ? 'text-gx-cyan' : 'text-gx-purple'}`}>
            {currentMode === 'code' ? '{ }' : '👁️'}
          </div>
          <div className="text-2xl font-bold text-white capitalize">{currentMode}</div>
          <div className="text-sm text-gray-400">
            {currentMode === 'code' ? 'Qwen 2.5 Coder' : 'Vision Model'}
          </div>
        </div>
      </div>

      {/* Mode Switch Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSwitch('code')}
          disabled={switching || currentMode === 'code'}
          className={`btn ${
            currentMode === 'code'
              ? 'bg-gx-cyan/20 text-gx-cyan border border-gx-cyan'
              : 'btn-secondary'
          }`}
        >
          {switching && currentMode !== 'code' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Switching...
            </span>
          ) : (
            <>
              <span className="mr-2">{ }</span>
              Code
            </>
          )}
        </button>

        <button
          onClick={() => handleSwitch('vision')}
          disabled={switching || currentMode === 'vision'}
          className={`btn ${
            currentMode === 'vision'
              ? 'bg-gx-purple/20 text-gx-purple border border-gx-purple'
              : 'btn-secondary'
          }`}
        >
          {switching && currentMode !== 'vision' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Switching...
            </span>
          ) : (
            <>
              <span className="mr-2">👁️</span>
              Vision
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-gx-red/10 border border-gx-red/30 rounded-lg text-gx-red text-sm">
          {error}
        </div>
      )}

      {/* Script Status */}
      {status?.brain.scripts_available && (
        <div className="mt-4 pt-4 border-t border-gx-border">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${status.brain.scripts_available.statusScript ? 'bg-gx-green' : 'bg-gx-red'}`} />
              status.sh
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${status.brain.scripts_available.switchScript ? 'bg-gx-green' : 'bg-gx-red'}`} />
              switch.sh
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
