import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchApi } from '../hooks/useFetch';
import type { AlertThresholds } from '../types';

interface DashboardConfig {
  server: {
    port: number;
    updateInterval: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: AlertThresholds;
  };
}

interface SettingsResponse {
  config: DashboardConfig;
  defaults: DashboardConfig;
}

type TabType = 'alerts' | 'display';

interface ThresholdInputProps {
  label: string;
  type: keyof AlertThresholds;
  thresholds: AlertThresholds;
  onChange: (type: keyof AlertThresholds, field: 'warning' | 'critical', value: number) => void;
  unit?: string;
}

function ThresholdInput({ label, type, thresholds, onChange, unit = '%' }: ThresholdInputProps) {
  const threshold = thresholds[type];
  const [warningError, setWarningError] = useState<string | null>(null);
  const [criticalError, setCriticalError] = useState<string | null>(null);

  const validateAndUpdate = (field: 'warning' | 'critical', value: string) => {
    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      if (field === 'warning') setWarningError('Must be a number');
      else setCriticalError('Must be a number');
      return;
    }

    if (numValue < 0 || numValue > 100) {
      if (field === 'warning') setWarningError('Must be 0-100');
      else setCriticalError('Must be 0-100');
      return;
    }

    if (field === 'warning' && numValue >= threshold.critical) {
      setWarningError('Must be less than critical');
      return;
    }

    if (field === 'critical' && numValue <= threshold.warning) {
      setCriticalError('Must be greater than warning');
      return;
    }

    setWarningError(null);
    setCriticalError(null);
    onChange(type, field, numValue);
  };

  return (
    <div className="bg-gx-dark/50 rounded-lg p-4">
      <div className="text-sm font-medium text-white mb-3">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Warning ({unit})</label>
          <input
            type="number"
            min="0"
            max="100"
            value={threshold.warning}
            onChange={(e) => validateAndUpdate('warning', e.target.value)}
            className={`w-full px-3 py-2 bg-gx-card border rounded-lg text-white text-sm focus:outline-none focus:ring-2 ${
              warningError ? 'border-gx-red focus:ring-gx-red' : 'border-gx-border focus:ring-gx-cyan'
            }`}
          />
          {warningError && <p className="text-xs text-gx-red mt-1">{warningError}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Critical ({unit})</label>
          <input
            type="number"
            min="0"
            max="100"
            value={threshold.critical}
            onChange={(e) => validateAndUpdate('critical', e.target.value)}
            className={`w-full px-3 py-2 bg-gx-card border rounded-lg text-white text-sm focus:outline-none focus:ring-2 ${
              criticalError ? 'border-gx-red focus:ring-gx-red' : 'border-gx-border focus:ring-gx-cyan'
            }`}
          />
          {criticalError && <p className="text-xs text-gx-red mt-1">{criticalError}</p>}
        </div>
      </div>
    </div>
  );
}

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { alertThresholds, alertsEnabled, setAlertThresholds, setAlertsEnabled } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [localThresholds, setLocalThresholds] = useState<AlertThresholds>(alertThresholds);
  const [localAlertsEnabled, setLocalAlertsEnabled] = useState(alertsEnabled);
  const [updateInterval, setUpdateInterval] = useState(2000);
  const [defaults, setDefaults] = useState<DashboardConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from server
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetchApi<SettingsResponse>('/api/settings');
        setDefaults(response.defaults);
        setUpdateInterval(response.config.server.updateInterval);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const thresholdsChanged = JSON.stringify(localThresholds) !== JSON.stringify(alertThresholds);
    const enabledChanged = localAlertsEnabled !== alertsEnabled;
    setHasChanges(thresholdsChanged || enabledChanged);
  }, [localThresholds, localAlertsEnabled, alertThresholds, alertsEnabled]);

  const handleThresholdChange = (type: keyof AlertThresholds, field: 'warning' | 'critical', value: number) => {
    setLocalThresholds(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update local store
      setAlertThresholds(localThresholds);
      setAlertsEnabled(localAlertsEnabled);

      // Sync with server
      await fetchApi('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          server: { updateInterval },
          alerts: {
            enabled: localAlertsEnabled,
            thresholds: localThresholds,
          },
        }),
      });

      showNotification('success', 'Settings saved successfully');
      setHasChanges(false);
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!defaults) return;

    setSaving(true);
    try {
      // Reset to defaults
      setLocalThresholds(defaults.alerts.thresholds);
      setLocalAlertsEnabled(defaults.alerts.enabled);
      setUpdateInterval(defaults.server.updateInterval);

      // Update store
      setAlertThresholds(defaults.alerts.thresholds);
      setAlertsEnabled(defaults.alerts.enabled);

      // Sync with server
      await fetchApi('/api/settings/reset', { method: 'POST' });

      showNotification('success', 'Settings reset to defaults');
      setHasChanges(false);
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gx-dark">
      {/* Header */}
      <header className="border-b border-gx-border bg-gx-card">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Settings</h1>
              <p className="text-xs text-gray-400">Configure dashboard and alerts</p>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg border ${
          notification.type === 'success'
            ? 'bg-gx-green/20 border-gx-green/50 text-gx-green'
            : 'bg-gx-red/20 border-gx-red/50 text-gx-red'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-gx-cyan text-gx-dark'
                : 'bg-gx-card text-gray-400 hover:text-white'
            }`}
          >
            Alert Settings
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'display'
                ? 'bg-gx-cyan text-gx-dark'
                : 'bg-gx-card text-gray-400 hover:text-white'
            }`}
          >
            Display Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Alerts Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-gx-border">
                <div>
                  <div className="text-sm font-medium text-white">Enable Alerts</div>
                  <div className="text-xs text-gray-400">Show notifications when thresholds are exceeded</div>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localAlertsEnabled}
                    onChange={(e) => setLocalAlertsEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${localAlertsEnabled ? 'bg-gx-cyan' : 'bg-gx-border'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localAlertsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>

              {/* Threshold Settings */}
              <div>
                <div className="text-sm font-medium text-gray-400 mb-4">Alert Thresholds</div>
                <div className="space-y-4">
                  <ThresholdInput
                    label="CPU Usage"
                    type="cpu"
                    thresholds={localThresholds}
                    onChange={handleThresholdChange}
                  />
                  <ThresholdInput
                    label="GPU Temperature"
                    type="gpu_temp"
                    thresholds={localThresholds}
                    onChange={handleThresholdChange}
                    unit="C"
                  />
                  <ThresholdInput
                    label="Memory Usage"
                    type="memory"
                    thresholds={localThresholds}
                    onChange={handleThresholdChange}
                  />
                  <ThresholdInput
                    label="Disk Usage"
                    type="disk"
                    thresholds={localThresholds}
                    onChange={handleThresholdChange}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Update Interval */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Update Interval</label>
                <p className="text-xs text-gray-400 mb-3">How often to refresh real-time metrics (milliseconds)</p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={updateInterval}
                    onChange={(e) => setUpdateInterval(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 bg-gx-border rounded-lg appearance-none cursor-pointer accent-gx-cyan"
                  />
                  <div className="w-20 px-3 py-2 bg-gx-dark/50 rounded-lg text-center">
                    <span className="text-white text-sm font-medium">{updateInterval}ms</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>500ms (Fast)</span>
                  <span>10000ms (Slow)</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gx-dark/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gx-cyan flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm text-white">About Update Interval</div>
                    <p className="text-xs text-gray-400 mt-1">
                      Lower values provide more real-time data but may increase CPU usage.
                      The default value of 2000ms provides a good balance between responsiveness and performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleReset}
            disabled={saving}
            className="btn btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <div className="mt-4 text-center">
            <span className="text-xs text-gx-yellow">You have unsaved changes</span>
          </div>
        )}
      </main>
    </div>
  );
}
