import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  readyState = 1;
  send = vi.fn();
  close = vi.fn();

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
}
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      createObjectStore: vi.fn(() => ({
        createIndex: vi.fn(),
      })),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          count: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
            result: 0,
          })),
          index: vi.fn(() => ({
            openCursor: vi.fn(() => ({
              onsuccess: null,
              onerror: null,
            })),
          })),
        })),
      })),
      close: vi.fn(),
    },
  })),
};
Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock IDBKeyRange
global.IDBKeyRange = {
  upperBound: vi.fn(),
  lowerBound: vi.fn(),
  bound: vi.fn(),
  only: vi.fn(),
} as unknown as typeof IDBKeyRange;

// Mock Notification
const mockNotification = vi.fn();
Object.defineProperty(mockNotification, 'permission', {
  value: 'default',
  writable: true,
});
mockNotification.requestPermission = vi.fn(() => Promise.resolve('granted'));
global.Notification = mockNotification as unknown as typeof Notification;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia - using a stable function, not vi.fn to avoid being cleared by restoreAllMocks
const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});
