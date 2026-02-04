import { useCallback, useRef, useEffect } from 'react';

export interface MetricsRecord {
  id?: number;
  timestamp: string;
  cpu: number;
  memory: number;
  gpu: number | null;
  gpuTemp: number | null;
  gpuMemory: number | null;
}

export interface MetricsStats {
  count: number;
  oldest: string | null;
  newest: string | null;
  avgCpu: number;
  avgMemory: number;
  avgGpu: number | null;
}

// Store up to 24 hours of data (1 record per 2 seconds = 43200 records)
const MAX_RECORDS = 43200;
const DB_NAME = 'gx10-metrics';
const DB_VERSION = 1;
const STORE_NAME = 'metrics';

type TimeRange = '1m' | '5m' | '1h' | '24h';

function getTimeRangeMs(range: TimeRange): number {
  switch (range) {
    case '1m':
      return 60 * 1000;
    case '5m':
      return 5 * 60 * 1000;
    case '1h':
      return 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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

export function useMetricsDB() {
  const dbRef = useRef<IDBDatabase | null>(null);
  const isInitializedRef = useRef(false);

  const initDB = useCallback(async (): Promise<boolean> => {
    if (isInitializedRef.current && dbRef.current) {
      return true;
    }

    try {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported');
        return false;
      }

      dbRef.current = await openDatabase();
      isInitializedRef.current = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      return false;
    }
  }, []);

  const saveMetrics = useCallback(
    async (data: Omit<MetricsRecord, 'id'>): Promise<boolean> => {
      try {
        if (!dbRef.current) {
          const initialized = await initDB();
          if (!initialized) return false;
        }

        const db = dbRef.current!;
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve) => {
          const request = store.add(data);
          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.error('Failed to save metrics:', request.error);
            resolve(false);
          };
        });
      } catch (error) {
        console.error('Error saving metrics:', error);
        return false;
      }
    },
    [initDB]
  );

  const getMetrics = useCallback(
    async (range: TimeRange): Promise<MetricsRecord[]> => {
      try {
        if (!dbRef.current) {
          const initialized = await initDB();
          if (!initialized) return [];
        }

        const db = dbRef.current!;
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('by-timestamp');

        const rangeMs = getTimeRangeMs(range);
        const startTime = new Date(Date.now() - rangeMs).toISOString();

        return new Promise((resolve) => {
          const results: MetricsRecord[] = [];
          const request = index.openCursor(IDBKeyRange.lowerBound(startTime));

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results);
            }
          };

          request.onerror = () => {
            console.error('Failed to get metrics:', request.error);
            resolve([]);
          };
        });
      } catch (error) {
        console.error('Error getting metrics:', error);
        return [];
      }
    },
    [initDB]
  );

  const getLatestMetrics = useCallback(
    async (count: number): Promise<MetricsRecord[]> => {
      try {
        if (!dbRef.current) {
          const initialized = await initDB();
          if (!initialized) return [];
        }

        const db = dbRef.current!;
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('by-timestamp');

        return new Promise((resolve) => {
          const results: MetricsRecord[] = [];
          const request = index.openCursor(null, 'prev');

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && results.length < count) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results.reverse());
            }
          };

          request.onerror = () => {
            console.error('Failed to get latest metrics:', request.error);
            resolve([]);
          };
        });
      } catch (error) {
        console.error('Error getting latest metrics:', error);
        return [];
      }
    },
    [initDB]
  );

  const clearOldMetrics = useCallback(async (): Promise<number> => {
    try {
      if (!dbRef.current) {
        const initialized = await initDB();
        if (!initialized) return 0;
      }

      const db = dbRef.current!;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('by-timestamp');

      // Delete records older than 24 hours
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      return new Promise((resolve) => {
        let deletedCount = 0;
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          console.error('Failed to clear old metrics:', request.error);
          resolve(0);
        };
      });
    } catch (error) {
      console.error('Error clearing old metrics:', error);
      return 0;
    }
  }, [initDB]);

  const enforceMaxRecords = useCallback(async (): Promise<void> => {
    try {
      if (!dbRef.current) {
        const initialized = await initDB();
        if (!initialized) return;
      }

      const db = dbRef.current!;
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
            }
          };
        }
      };
    } catch (error) {
      console.error('Error enforcing max records:', error);
    }
  }, [initDB]);

  const exportMetrics = useCallback(
    async (
      format: 'json' | 'csv',
      startDate?: Date,
      endDate?: Date
    ): Promise<string> => {
      try {
        if (!dbRef.current) {
          const initialized = await initDB();
          if (!initialized) return '';
        }

        const db = dbRef.current!;
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('by-timestamp');

        let range: IDBKeyRange | null = null;
        if (startDate && endDate) {
          range = IDBKeyRange.bound(
            startDate.toISOString(),
            endDate.toISOString()
          );
        } else if (startDate) {
          range = IDBKeyRange.lowerBound(startDate.toISOString());
        } else if (endDate) {
          range = IDBKeyRange.upperBound(endDate.toISOString());
        }

        const results: MetricsRecord[] = await new Promise((resolve) => {
          const data: MetricsRecord[] = [];
          const request = index.openCursor(range);

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              data.push(cursor.value);
              cursor.continue();
            } else {
              resolve(data);
            }
          };

          request.onerror = () => {
            console.error('Failed to export metrics:', request.error);
            resolve([]);
          };
        });

        if (format === 'json') {
          return JSON.stringify(results, null, 2);
        }

        // CSV format
        const headers = [
          'timestamp',
          'cpu',
          'memory',
          'gpu',
          'gpuTemp',
          'gpuMemory',
        ];
        const csvRows = [headers.join(',')];

        for (const record of results) {
          const row = [
            record.timestamp,
            record.cpu.toFixed(2),
            record.memory.toFixed(2),
            record.gpu !== null ? record.gpu.toFixed(2) : '',
            record.gpuTemp !== null ? record.gpuTemp.toFixed(1) : '',
            record.gpuMemory !== null ? record.gpuMemory.toFixed(0) : '',
          ];
          csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
      } catch (error) {
        console.error('Error exporting metrics:', error);
        return '';
      }
    },
    [initDB]
  );

  const getStats = useCallback(async (): Promise<MetricsStats> => {
    try {
      if (!dbRef.current) {
        const initialized = await initDB();
        if (!initialized) {
          return {
            count: 0,
            oldest: null,
            newest: null,
            avgCpu: 0,
            avgMemory: 0,
            avgGpu: null,
          };
        }
      }

      const db = dbRef.current!;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('by-timestamp');

      const countPromise = new Promise<number>((resolve) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      const oldestPromise = new Promise<string | null>((resolve) => {
        const request = index.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          resolve(cursor ? cursor.value.timestamp : null);
        };
        request.onerror = () => resolve(null);
      });

      const newestPromise = new Promise<string | null>((resolve) => {
        const request = index.openCursor(null, 'prev');
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          resolve(cursor ? cursor.value.timestamp : null);
        };
        request.onerror = () => resolve(null);
      });

      const averagesPromise = new Promise<{
        avgCpu: number;
        avgMemory: number;
        avgGpu: number | null;
      }>((resolve) => {
        let totalCpu = 0;
        let totalMemory = 0;
        let totalGpu = 0;
        let gpuCount = 0;
        let count = 0;

        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const record = cursor.value as MetricsRecord;
            totalCpu += record.cpu;
            totalMemory += record.memory;
            if (record.gpu !== null) {
              totalGpu += record.gpu;
              gpuCount++;
            }
            count++;
            cursor.continue();
          } else {
            resolve({
              avgCpu: count > 0 ? totalCpu / count : 0,
              avgMemory: count > 0 ? totalMemory / count : 0,
              avgGpu: gpuCount > 0 ? totalGpu / gpuCount : null,
            });
          }
        };
        request.onerror = () =>
          resolve({ avgCpu: 0, avgMemory: 0, avgGpu: null });
      });

      const [count, oldest, newest, averages] = await Promise.all([
        countPromise,
        oldestPromise,
        newestPromise,
        averagesPromise,
      ]);

      return {
        count,
        oldest,
        newest,
        ...averages,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        count: 0,
        oldest: null,
        newest: null,
        avgCpu: 0,
        avgMemory: 0,
        avgGpu: null,
      };
    }
  }, [initDB]);

  const clearAllMetrics = useCallback(async (): Promise<boolean> => {
    try {
      if (!dbRef.current) {
        const initialized = await initDB();
        if (!initialized) return false;
      }

      const db = dbRef.current!;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('Failed to clear metrics:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error clearing metrics:', error);
      return false;
    }
  }, [initDB]);

  // Initialize DB on mount
  useEffect(() => {
    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [initDB]);

  return {
    initDB,
    saveMetrics,
    getMetrics,
    getLatestMetrics,
    clearOldMetrics,
    enforceMaxRecords,
    exportMetrics,
    getStats,
    clearAllMetrics,
  };
}
