import { create } from 'zustand';
import type { FullStatus, MetricsData, Alert, AlertThresholds, AlertType, AlertSeverity } from '../types';

interface MetricsHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  gpu: number | null;
}

// IndexedDB Configuration
const DB_NAME = 'gx10-metrics';
const DB_VERSION = 1;
const STORE_NAME = 'metrics';
const MAX_RECORDS = 8640; // 24 hours at 10-second intervals (optimized)

interface MetricsRecord {
  id?: number;
  timestamp: string;
  cpu: number;
  memory: number;
  gpu: number | null;
  gpuTemp: number | null;
  gpuMemory: number | null;
}

// IndexedDB Helper Functions
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function saveMetricsToIndexedDB(record: Omit<MetricsRecord, 'id'>): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.add(record);
      request.onsuccess = () => {
        db.close();
        resolve(true);
      };
      request.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

async function enforceMaxRecords(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const totalCount = countRequest.result;
      if (totalCount > MAX_RECORDS) {
        const deleteCount = totalCount - MAX_RECORDS;
        const index = store.index('by-timestamp');
        const cursorRequest = index.openCursor();
        let deleted = 0;

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && deleted < deleteCount) {
            cursor.delete();
            deleted++;
            cursor.continue();
          } else {
            db.close();
          }
        };

        cursorRequest.onerror = () => {
          db.close();
        };
      } else {
        db.close();
      }
    };

    countRequest.onerror = () => {
      db.close();
    };
  } catch {
    // Ignore errors
  }
}

async function cleanupOldRecords(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by-timestamp');

    // Delete records older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        db.close();
      }
    };

    request.onerror = () => {
      db.close();
    };
  } catch {
    // Ignore errors
  }
}

// Persistence state
let persistenceInitialized = false;
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

const DEFAULT_THRESHOLDS: AlertThresholds = {
  cpu: { warning: 80, critical: 90 },
  gpu_temp: { warning: 75, critical: 85 },
  memory: { warning: 80, critical: 90 },
  disk: { warning: 85, critical: 95 },
};

const ALERTS_STORAGE_KEY = 'gx10-alerts';
const THRESHOLDS_STORAGE_KEY = 'gx10-alert-thresholds';
const ALERTS_ENABLED_KEY = 'gx10-alerts-enabled';
const MAX_ALERTS = 100;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

function generateAlertId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showBrowserNotification(alert: Alert): void {
  if ('Notification' in window && Notification.permission === 'granted' && alert.severity === 'critical') {
    new Notification('GX10 Critical Alert', {
      body: alert.message,
      icon: '/favicon.ico',
      tag: alert.type,
    });
  }
}

interface DashboardStore {
  // Data
  status: FullStatus | null;
  metrics: MetricsData | null;
  metricsHistory: MetricsHistory[];

  // Connection state
  connected: boolean;
  lastUpdate: string | null;
  error: string | null;

  // Alerts
  alerts: Alert[];
  alertThresholds: AlertThresholds;
  alertsEnabled: boolean;

  // Persistence state
  persistenceEnabled: boolean;

  // Actions
  setStatus: (status: FullStatus) => void;
  setMetrics: (metrics: MetricsData) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  updateBrainMode: (mode: 'code' | 'vision') => void;

  // Alert Actions
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  setAlertThresholds: (thresholds: AlertThresholds) => void;
  setAlertsEnabled: (enabled: boolean) => void;

  // Persistence Actions
  initPersistence: () => void;
  setPersistenceEnabled: (enabled: boolean) => void;
}

const MAX_HISTORY = 30; // 5 minutes of data at 10-second intervals (optimized)

// Request notification permission on load
requestNotificationPermission();

function checkThresholdsAndCreateAlerts(
  metrics: MetricsData,
  status: FullStatus | null,
  thresholds: AlertThresholds,
  existingAlerts: Alert[]
): Alert[] {
  const newAlerts: Alert[] = [];
  const now = new Date().toISOString();

  const createAlert = (
    type: AlertType,
    value: number,
    threshold: number,
    severity: AlertSeverity,
    message: string
  ) => {
    // Avoid duplicate alerts of the same type
    const hasExistingAlert = existingAlerts.some(
      (a) => a.type === type && !a.dismissed
    );
    if (!hasExistingAlert) {
      const alert: Alert = {
        id: generateAlertId(),
        type,
        severity,
        message,
        value,
        threshold,
        timestamp: now,
        dismissed: false,
      };
      newAlerts.push(alert);
      showBrowserNotification(alert);
    }
  };

  // Check CPU usage
  const cpuUsage = metrics.cpu.usage;
  if (cpuUsage >= thresholds.cpu.critical) {
    createAlert('cpu', cpuUsage, thresholds.cpu.critical, 'critical', `CPU usage critical: ${cpuUsage.toFixed(1)}%`);
  } else if (cpuUsage >= thresholds.cpu.warning) {
    createAlert('cpu', cpuUsage, thresholds.cpu.warning, 'warning', `CPU usage high: ${cpuUsage.toFixed(1)}%`);
  }

  // Check GPU temperature
  if (metrics.gpu?.temperature !== undefined) {
    const gpuTemp = metrics.gpu.temperature;
    if (gpuTemp >= thresholds.gpu_temp.critical) {
      createAlert('gpu_temp', gpuTemp, thresholds.gpu_temp.critical, 'critical', `GPU temperature critical: ${gpuTemp}C`);
    } else if (gpuTemp >= thresholds.gpu_temp.warning) {
      createAlert('gpu_temp', gpuTemp, thresholds.gpu_temp.warning, 'warning', `GPU temperature high: ${gpuTemp}C`);
    }
  }

  // Check Memory usage
  const memoryUsage = metrics.memory.percentage;
  if (memoryUsage >= thresholds.memory.critical) {
    createAlert('memory', memoryUsage, thresholds.memory.critical, 'critical', `Memory usage critical: ${memoryUsage.toFixed(1)}%`);
  } else if (memoryUsage >= thresholds.memory.warning) {
    createAlert('memory', memoryUsage, thresholds.memory.warning, 'warning', `Memory usage high: ${memoryUsage.toFixed(1)}%`);
  }

  // Check Disk usage (from status)
  if (status?.disk) {
    const maxDiskUsage = Math.max(...status.disk.map((d) => d.percentage));
    if (maxDiskUsage >= thresholds.disk.critical) {
      createAlert('disk', maxDiskUsage, thresholds.disk.critical, 'critical', `Disk usage critical: ${maxDiskUsage.toFixed(1)}%`);
    } else if (maxDiskUsage >= thresholds.disk.warning) {
      createAlert('disk', maxDiskUsage, thresholds.disk.warning, 'warning', `Disk usage high: ${maxDiskUsage.toFixed(1)}%`);
    }
  }

  return newAlerts;
}

export const useStore = create<DashboardStore>((set, get) => ({
  status: null,
  metrics: null,
  metricsHistory: [],
  connected: false,
  lastUpdate: null,
  error: null,

  // Alert state with localStorage persistence
  alerts: loadFromStorage<Alert[]>(ALERTS_STORAGE_KEY, []),
  alertThresholds: loadFromStorage<AlertThresholds>(THRESHOLDS_STORAGE_KEY, DEFAULT_THRESHOLDS),
  alertsEnabled: loadFromStorage<boolean>(ALERTS_ENABLED_KEY, true),

  // Persistence state
  persistenceEnabled: true,

  setStatus: (status) =>
    set({
      status,
      lastUpdate: new Date().toISOString(),
      error: null,
    }),

  setMetrics: (metrics) =>
    set((state) => {
      const newHistory: MetricsHistory = {
        timestamp: metrics.timestamp,
        cpu: metrics.cpu.usage,
        memory: metrics.memory.percentage,
        gpu: metrics.gpu?.utilization ?? null,
      };

      const history = [...state.metricsHistory, newHistory].slice(-MAX_HISTORY);

      // Check thresholds and generate alerts if enabled
      let updatedAlerts = state.alerts;
      if (state.alertsEnabled) {
        const newAlerts = checkThresholdsAndCreateAlerts(
          metrics,
          state.status,
          state.alertThresholds,
          state.alerts
        );
        if (newAlerts.length > 0) {
          updatedAlerts = [...state.alerts, ...newAlerts].slice(-MAX_ALERTS);
          saveToStorage(ALERTS_STORAGE_KEY, updatedAlerts);
        }
      }

      // Save to IndexedDB if persistence is enabled
      if (state.persistenceEnabled && persistenceInitialized) {
        const record: Omit<MetricsRecord, 'id'> = {
          timestamp: metrics.timestamp,
          cpu: metrics.cpu.usage,
          memory: metrics.memory.percentage,
          gpu: metrics.gpu?.utilization ?? null,
          gpuTemp: metrics.gpu?.temperature ?? null,
          gpuMemory: metrics.gpu?.memory_used ?? null,
        };
        saveMetricsToIndexedDB(record);
      }

      return {
        metrics,
        metricsHistory: history,
        lastUpdate: new Date().toISOString(),
        error: null,
        alerts: updatedAlerts,
      };
    }),

  setConnected: (connected) => set({ connected }),

  setError: (error) => set({ error }),

  updateBrainMode: (mode) =>
    set((state) => {
      if (!state.status) return state;
      return {
        status: {
          ...state.status,
          brain: {
            ...state.status.brain,
            active: mode,
          },
        },
      };
    }),

  // Alert Actions
  addAlert: (alert) =>
    set((state) => {
      // Avoid duplicates by type
      const hasExisting = state.alerts.some(
        (a) => a.type === alert.type && !a.dismissed
      );
      if (hasExisting) return state;

      const updatedAlerts = [...state.alerts, alert].slice(-MAX_ALERTS);
      saveToStorage(ALERTS_STORAGE_KEY, updatedAlerts);
      showBrowserNotification(alert);
      return { alerts: updatedAlerts };
    }),

  dismissAlert: (id) =>
    set((state) => {
      const updatedAlerts = state.alerts.map((alert) =>
        alert.id === id ? { ...alert, dismissed: true } : alert
      );
      saveToStorage(ALERTS_STORAGE_KEY, updatedAlerts);
      return { alerts: updatedAlerts };
    }),

  clearAlerts: () =>
    set(() => {
      saveToStorage(ALERTS_STORAGE_KEY, []);
      return { alerts: [] };
    }),

  setAlertThresholds: (thresholds) =>
    set(() => {
      saveToStorage(THRESHOLDS_STORAGE_KEY, thresholds);
      return { alertThresholds: thresholds };
    }),

  setAlertsEnabled: (enabled) =>
    set(() => {
      saveToStorage(ALERTS_ENABLED_KEY, enabled);
      if (enabled) {
        requestNotificationPermission();
      }
      return { alertsEnabled: enabled };
    }),

  // Persistence Actions
  initPersistence: () => {
    if (persistenceInitialized) return;

    // Check if IndexedDB is available
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available. Metrics persistence disabled.');
      set({ persistenceEnabled: false });
      return;
    }

    // Initialize the database
    openDatabase()
      .then(() => {
        persistenceInitialized = true;
        console.log('IndexedDB initialized for metrics persistence');

        // Start periodic cleanup (every 30 minutes)
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
        }
        cleanupInterval = setInterval(() => {
          cleanupOldRecords();
          enforceMaxRecords();
        }, 30 * 60 * 1000);

        // Initial cleanup
        cleanupOldRecords();
        enforceMaxRecords();
      })
      .catch((error) => {
        console.error('Failed to initialize IndexedDB:', error);
        set({ persistenceEnabled: false });
      });
  },

  setPersistenceEnabled: (enabled) => {
    set({ persistenceEnabled: enabled });
    if (enabled && !persistenceInitialized) {
      get().initPersistence();
    }
  },
}));
