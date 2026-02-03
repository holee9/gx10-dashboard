import { useEffect, useState } from 'react';
import { fetchApi } from '../hooks/useFetch';

interface VisionStatus {
  status: 'running' | 'stopped' | 'error';
  container_id?: string;
  container_name?: string;
  image?: string;
  uptime?: string;
  gpu_attached?: boolean;
  memory_usage?: string;
  error?: string;
}

interface VisionModel {
  name: string;
  type: string;
  loaded: boolean;
}

export function VisionCard() {
  const [visionStatus, setVisionStatus] = useState<VisionStatus | null>(null);
  const [models, setModels] = useState<VisionModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisionStatus = async () => {
      try {
        const [status, modelsData] = await Promise.all([
          fetchApi<VisionStatus>('/api/metrics/vision'),
          fetchApi<{ models: VisionModel[] }>('/api/metrics/vision/models'),
        ]);
        setVisionStatus(status);
        setModels(modelsData.models || []);
      } catch {
        setVisionStatus({ status: 'error', error: 'Failed to fetch status' });
      } finally {
        setLoading(false);
      }
    };

    fetchVisionStatus();
    const interval = setInterval(fetchVisionStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const isRunning = visionStatus?.status === 'running';

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>Vision Brain</span>
        <span className={`ml-auto badge ${isRunning ? 'badge-green' : 'badge-yellow'}`}>
          {loading ? 'Checking...' : isRunning ? 'Running' : 'Standby'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-gx-cyan" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !isRunning ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="text-white">Vision Brain on Standby</p>
          <p className="text-sm mt-1">Switch to Vision mode to activate</p>
        </div>
      ) : (
        <>
          {/* Container Info */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Container</span>
              <span className="text-white font-mono text-sm">
                {visionStatus?.container_name || 'gx10-vision-brain'}
              </span>
            </div>
            {visionStatus?.uptime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className="text-gx-green text-sm">{visionStatus.uptime}</span>
              </div>
            )}
            {visionStatus?.gpu_attached && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">GPU</span>
                <span className="badge badge-green">Attached</span>
              </div>
            )}
            {visionStatus?.memory_usage && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Memory</span>
                <span className="text-white text-sm">{visionStatus.memory_usage}</span>
              </div>
            )}
          </div>

          {/* Vision Models */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Vision Models</div>
            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.name}
                  className="flex items-center gap-2 p-2 bg-gx-dark rounded-lg"
                >
                  <span className={`w-2 h-2 rounded-full ${model.loaded ? 'bg-gx-green animate-pulse' : 'bg-gray-600'}`} />
                  <div className="flex-1">
                    <span className="text-white font-medium">{model.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{model.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
