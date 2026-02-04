import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Alert, AlertType } from '../types';

function getAlertIcon(type: AlertType): JSX.Element {
  switch (type) {
    case 'cpu':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    case 'gpu_temp':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      );
    case 'memory':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'disk':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

function AlertItem({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const isWarning = alert.severity === 'warning';
  const colorClass = isWarning ? 'text-gx-yellow' : 'text-gx-red';
  const bgClass = isWarning ? 'bg-gx-yellow/10' : 'bg-gx-red/10';
  const borderClass = isWarning ? 'border-gx-yellow/30' : 'border-gx-red/30';

  return (
    <div className={`flex items-center justify-between gap-3 p-2 rounded-lg border ${bgClass} ${borderClass}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={colorClass}>{getAlertIcon(alert.type)}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${colorClass}`}>{alert.message}</p>
          <p className="text-xs text-gray-500">
            Threshold: {alert.threshold}% | {formatTimestamp(alert.timestamp)}
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss alert"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function AlertPanel() {
  const { alerts, alertsEnabled, dismissAlert, clearAlerts, setAlertsEnabled } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;
  const hasAlerts = activeAlerts.length > 0;
  const hasNewCritical = criticalCount > 0;

  if (!hasAlerts && !isExpanded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between bg-gx-card border border-gx-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-xs">No active alerts</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-500">Alerts</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-8 h-4 rounded-full transition-colors ${alertsEnabled ? 'bg-gx-cyan' : 'bg-gx-border'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${alertsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="bg-gx-card border border-gx-border rounded-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gx-border/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {/* Bell icon with animation */}
            <div className={`relative ${hasNewCritical ? 'animate-pulse' : ''}`}>
              <svg
                className={`w-5 h-5 ${hasNewCritical ? 'text-gx-red' : hasAlerts ? 'text-gx-yellow' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {hasAlerts && (
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${hasNewCritical ? 'bg-gx-red' : 'bg-gx-yellow'}`} />
              )}
            </div>

            <span className="text-sm font-medium text-white">System Alerts</span>

            {/* Badge counts */}
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="badge badge-red">{criticalCount} Critical</span>
              )}
              {warningCount > 0 && (
                <span className="badge badge-yellow">{warningCount} Warning</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle alerts */}
            <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-gray-500">Alerts</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-8 h-4 rounded-full transition-colors ${alertsEnabled ? 'bg-gx-cyan' : 'bg-gx-border'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${alertsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </label>

            {/* Expand/Collapse indicator */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gx-border px-3 py-2">
            {activeAlerts.length > 0 ? (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onDismiss={() => dismissAlert(alert.id)}
                    />
                  ))}
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t border-gx-border">
                  <button
                    onClick={clearAlerts}
                    className="text-xs text-gray-400 hover:text-gx-red transition-colors"
                  >
                    Clear All Alerts
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No active alerts</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
