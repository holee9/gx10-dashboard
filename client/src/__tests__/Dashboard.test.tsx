import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../components/Dashboard';
import { useStore } from '../store/useStore';
import type { FullStatus } from '../types';

// Mock child components to simplify testing
vi.mock('../components/SystemCard', () => ({
  SystemCard: () => <div data-testid="system-card">SystemCard</div>,
}));

vi.mock('../components/GpuCard', () => ({
  GpuCard: () => <div data-testid="gpu-card">GpuCard</div>,
}));

vi.mock('../components/StorageCard', () => ({
  StorageCard: () => <div data-testid="storage-card">StorageCard</div>,
}));

vi.mock('../components/NetworkCard', () => ({
  NetworkCard: () => <div data-testid="network-card">NetworkCard</div>,
}));

vi.mock('../components/BrainCard', () => ({
  BrainCard: () => <div data-testid="brain-card">BrainCard</div>,
}));

vi.mock('../components/OllamaCard', () => ({
  OllamaCard: () => <div data-testid="ollama-card">OllamaCard</div>,
}));

vi.mock('../components/VisionCard', () => ({
  VisionCard: () => <div data-testid="vision-card">VisionCard</div>,
}));

vi.mock('../components/MetricsChart', () => ({
  MetricsChart: () => <div data-testid="metrics-chart">MetricsChart</div>,
}));

vi.mock('../components/HistoryChart', () => ({
  HistoryChart: () => <div data-testid="history-chart">HistoryChart</div>,
}));

vi.mock('../components/AlertPanel', () => ({
  AlertPanel: () => <div data-testid="alert-panel">AlertPanel</div>,
}));

vi.mock('../components/ProcessList', () => ({
  ProcessList: () => <div data-testid="process-list">ProcessList</div>,
}));

vi.mock('../components/CpuCoreChart', () => ({
  CpuCoreChart: () => <div data-testid="cpu-core-chart">CpuCoreChart</div>,
}));

vi.mock('../components/MemoryDetailCard', () => ({
  MemoryDetailCard: () => <div data-testid="memory-detail-card">MemoryDetailCard</div>,
}));

vi.mock('../components/ExportButton', () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>,
}));

// Reset the store before each test
beforeEach(() => {
  useStore.setState({
    status: null,
    metrics: null,
    metricsHistory: [],
    connected: false,
    lastUpdate: null,
    error: null,
    alerts: [],
    alertsEnabled: true,
    alertThresholds: {
      cpu: { warning: 80, critical: 90 },
      gpu_temp: { warning: 75, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
    },
    persistenceEnabled: true,
    initPersistence: vi.fn(),
  });
});

describe('Dashboard', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Dashboard />);

      expect(screen.getByText('GX10')).toBeInTheDocument();
      expect(screen.getByText('System Dashboard')).toBeInTheDocument();
    });

    it('should render all main cards', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('system-card')).toBeInTheDocument();
      expect(screen.getByTestId('gpu-card')).toBeInTheDocument();
      expect(screen.getByTestId('storage-card')).toBeInTheDocument();
      expect(screen.getByTestId('network-card')).toBeInTheDocument();
      expect(screen.getByTestId('brain-card')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-chart')).toBeInTheDocument();
      expect(screen.getByTestId('history-chart')).toBeInTheDocument();
      expect(screen.getByTestId('alert-panel')).toBeInTheDocument();
    });

    it('should render footer with version and links', () => {
      render(<Dashboard />);

      expect(screen.getByText('GX10 Dashboard v2.0.0')).toBeInTheDocument();
      expect(screen.getByText('API')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
  });

  describe('Connection status', () => {
    it('should show "Disconnected" when not connected', () => {
      useStore.setState({ connected: false });
      render(<Dashboard />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should show "Live" when connected', () => {
      useStore.setState({ connected: true });
      render(<Dashboard />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should display last update time when available', () => {
      const mockDate = '2024-01-15T10:30:00Z';
      useStore.setState({ lastUpdate: mockDate });
      render(<Dashboard />);

      // The time will be formatted based on locale
      const expectedTime = new Date(mockDate).toLocaleTimeString();
      expect(screen.getByText(expectedTime)).toBeInTheDocument();
    });
  });

  describe('Error display', () => {
    it('should display error message when error exists', () => {
      useStore.setState({ error: 'Connection failed' });
      render(<Dashboard />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should not display error banner when no error', () => {
      useStore.setState({ error: null });
      render(<Dashboard />);

      expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
    });
  });

  describe('Advanced view toggle', () => {
    it('should not show advanced panels by default', () => {
      render(<Dashboard />);

      expect(screen.queryByTestId('cpu-core-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('memory-detail-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('process-list')).not.toBeInTheDocument();
    });

    it('should show advanced panels when Advanced button is clicked', () => {
      render(<Dashboard />);

      const advancedButton = screen.getByRole('button', { name: /toggle advanced view/i });
      fireEvent.click(advancedButton);

      expect(screen.getByTestId('cpu-core-chart')).toBeInTheDocument();
      expect(screen.getByTestId('memory-detail-card')).toBeInTheDocument();
      expect(screen.getByTestId('process-list')).toBeInTheDocument();
    });

    it('should hide advanced panels when toggled off', () => {
      render(<Dashboard />);

      const advancedButton = screen.getByRole('button', { name: /toggle advanced view/i });

      // Toggle on
      fireEvent.click(advancedButton);
      expect(screen.getByTestId('process-list')).toBeInTheDocument();

      // Toggle off
      fireEvent.click(advancedButton);
      expect(screen.queryByTestId('process-list')).not.toBeInTheDocument();
    });
  });

  describe('Brain mode display', () => {
    it('should show OllamaCard when brain mode is "code"', () => {
      const mockStatus: FullStatus = {
        timestamp: '2024-01-15T10:00:00Z',
        system: {
          hostname: 'test-host',
          uptime: 3600,
          os: 'Linux',
          kernel: '5.15.0',
          arch: 'x86_64',
        },
        cpu: { usage: 50, cores: 8, temperature: 60 },
        memory: { total: 16000000000, used: 8000000000, free: 8000000000, percentage: 50 },
        disk: [],
        gpu: null,
        brain: { active: 'code', started_at: '2024-01-15T09:00:00Z', uptime_seconds: 3600 },
        ollama: { status: 'running', models_loaded: [] },
      };

      useStore.setState({ status: mockStatus });
      render(<Dashboard />);

      expect(screen.getByTestId('ollama-card')).toBeInTheDocument();
      expect(screen.queryByTestId('vision-card')).not.toBeInTheDocument();
    });

    it('should show VisionCard when brain mode is "vision"', () => {
      const mockStatus: FullStatus = {
        timestamp: '2024-01-15T10:00:00Z',
        system: {
          hostname: 'test-host',
          uptime: 3600,
          os: 'Linux',
          kernel: '5.15.0',
          arch: 'x86_64',
        },
        cpu: { usage: 50, cores: 8, temperature: 60 },
        memory: { total: 16000000000, used: 8000000000, free: 8000000000, percentage: 50 },
        disk: [],
        gpu: null,
        brain: { active: 'vision', started_at: '2024-01-15T09:00:00Z', uptime_seconds: 3600 },
        ollama: { status: 'running', models_loaded: [] },
      };

      useStore.setState({ status: mockStatus });
      render(<Dashboard />);

      expect(screen.getByTestId('vision-card')).toBeInTheDocument();
      expect(screen.queryByTestId('ollama-card')).not.toBeInTheDocument();
    });
  });

  describe('Settings button', () => {
    it('should render settings button when onOpenSettings is provided', () => {
      const mockOnOpenSettings = vi.fn();
      render(<Dashboard onOpenSettings={mockOnOpenSettings} />);

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should call onOpenSettings when settings button is clicked', () => {
      const mockOnOpenSettings = vi.fn();
      render(<Dashboard onOpenSettings={mockOnOpenSettings} />);

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      fireEvent.click(settingsButton);

      expect(mockOnOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('should not render settings button when onOpenSettings is not provided', () => {
      render(<Dashboard />);

      expect(screen.queryByRole('button', { name: /open settings/i })).not.toBeInTheDocument();
    });
  });

  describe('Export button', () => {
    it('should render export button', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should call initPersistence on mount', () => {
      const mockInitPersistence = vi.fn();
      useStore.setState({ initPersistence: mockInitPersistence });

      render(<Dashboard />);

      expect(mockInitPersistence).toHaveBeenCalled();
    });
  });
});
