import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchApi } from '../hooks/useFetch';
import type { OllamaStatus } from '../types';

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function OllamaCard() {
  const { status, metrics } = useStore();
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const modelsLoaded = metrics?.ollama.models_loaded ?? status?.ollama?.models_loaded ?? [];

  useEffect(() => {
    const fetchOllamaStatus = async () => {
      try {
        const data = await fetchApi<OllamaStatus>('/api/metrics/ollama');
        setOllamaStatus(data);
      } catch {
        // Ollama not available
      } finally {
        setLoading(false);
      }
    };

    fetchOllamaStatus();
    const interval = setInterval(fetchOllamaStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const isRunning = ollamaStatus?.status === 'running';

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span>Ollama</span>
        <span className={`ml-auto badge ${isRunning ? 'badge-green' : 'badge-red'}`}>
          {loading ? 'Checking...' : isRunning ? 'Running' : 'Stopped'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <svg className="animate-spin h-6 w-6 text-gx-cyan" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !isRunning ? (
        <div className="text-center py-6 text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Ollama is not running</p>
          <p className="text-xs">Start with: ollama serve</p>
        </div>
      ) : (
        <>
          {/* Version */}
          {ollamaStatus?.version && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">Version</span>
              <span className="badge badge-cyan">{ollamaStatus.version}</span>
            </div>
          )}

          {/* Loaded Models */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Loaded Models</div>
            {modelsLoaded.length > 0 ? (
              <div className="space-y-1">
                {modelsLoaded.map((model) => (
                  <div
                    key={model}
                    className="flex items-center gap-2 p-1.5 bg-gx-dark rounded"
                  >
                    <span className="w-2 h-2 rounded-full bg-gx-green animate-pulse" />
                    <span className="text-white text-sm font-medium">{model}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-xs">No models currently loaded</div>
            )}
          </div>

          {/* Available Models */}
          {ollamaStatus?.models && ollamaStatus.models.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">
                Available ({ollamaStatus.models.length})
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {ollamaStatus.models.map((model) => {
                  const isLoaded = modelsLoaded.includes(model.name);
                  return (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-1.5 bg-gx-dark rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isLoaded ? 'bg-gx-green' : 'bg-gray-600'
                          }`}
                        />
                        <span className={`text-sm ${isLoaded ? 'text-white' : 'text-gray-400'}`}>
                          {model.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatBytes(model.size)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
