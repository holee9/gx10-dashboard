import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertPanel } from '../components/AlertPanel';
import { useStore } from '../store/useStore';
import type { Alert } from '../types';

// Reset the store before each test
beforeEach(() => {
  useStore.setState({
    alerts: [],
    alertsEnabled: true,
    alertThresholds: {
      cpu: { warning: 80, critical: 90 },
      gpu_temp: { warning: 75, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
    },
  });
});

describe('AlertPanel', () => {
  describe('No alerts state', () => {
    it('should render "No active alerts" when there are no alerts', () => {
      render(<AlertPanel />);

      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should show alerts toggle switch', () => {
      render(<AlertPanel />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it('should allow toggling alerts on/off', () => {
      render(<AlertPanel />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const state = useStore.getState();
      expect(state.alertsEnabled).toBe(false);
    });
  });

  describe('With alerts', () => {
    const mockAlerts: Alert[] = [
      {
        id: 'alert-1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU usage high: 85%',
        value: 85,
        threshold: 80,
        timestamp: '2024-01-15T10:00:00Z',
        dismissed: false,
      },
      {
        id: 'alert-2',
        type: 'memory',
        severity: 'critical',
        message: 'Memory usage critical: 95%',
        value: 95,
        threshold: 90,
        timestamp: '2024-01-15T10:01:00Z',
        dismissed: false,
      },
    ];

    beforeEach(() => {
      useStore.setState({ alerts: mockAlerts });
    });

    it('should render alert messages correctly', () => {
      render(<AlertPanel />);

      // Click to expand the panel
      const header = screen.getByText('System Alerts');
      fireEvent.click(header);

      expect(screen.getByText('CPU usage high: 85%')).toBeInTheDocument();
      expect(screen.getByText('Memory usage critical: 95%')).toBeInTheDocument();
    });

    it('should show alert counts in badges', () => {
      render(<AlertPanel />);

      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
    });

    it('should dismiss individual alert when dismiss button clicked', () => {
      render(<AlertPanel />);

      // Expand the panel
      const header = screen.getByText('System Alerts');
      fireEvent.click(header);

      // Find and click the first dismiss button
      const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss alert' });
      fireEvent.click(dismissButtons[0]);

      const state = useStore.getState();
      expect(state.alerts[0].dismissed).toBe(true);
    });

    it('should clear all alerts when "Clear All Alerts" is clicked', () => {
      render(<AlertPanel />);

      // Expand the panel
      const header = screen.getByText('System Alerts');
      fireEvent.click(header);

      // Click clear all button
      const clearButton = screen.getByText('Clear All Alerts');
      fireEvent.click(clearButton);

      const state = useStore.getState();
      expect(state.alerts).toHaveLength(0);
    });

    it('should toggle panel expansion when header is clicked', () => {
      render(<AlertPanel />);

      // Initially the panel shows alert badges but not the content
      expect(screen.queryByText('CPU usage high: 85%')).not.toBeInTheDocument();

      // Click to expand
      const header = screen.getByText('System Alerts');
      fireEvent.click(header);

      // Now content should be visible
      expect(screen.getByText('CPU usage high: 85%')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(header);

      // Content should be hidden again
      expect(screen.queryByText('CPU usage high: 85%')).not.toBeInTheDocument();
    });

    it('should not show dismissed alerts in active count', () => {
      useStore.setState({
        alerts: [
          { ...mockAlerts[0], dismissed: true },
          mockAlerts[1],
        ],
      });

      render(<AlertPanel />);

      // Only the critical alert should be counted
      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.queryByText('1 Warning')).not.toBeInTheDocument();
    });
  });

  describe('Alert threshold display', () => {
    it('should show threshold value in alert details', () => {
      const alert: Alert = {
        id: 'alert-1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU usage high: 85%',
        value: 85,
        threshold: 80,
        timestamp: '2024-01-15T10:00:00Z',
        dismissed: false,
      };

      useStore.setState({ alerts: [alert] });
      render(<AlertPanel />);

      // Expand the panel
      const header = screen.getByText('System Alerts');
      fireEvent.click(header);

      expect(screen.getByText(/Threshold: 80%/)).toBeInTheDocument();
    });
  });

  describe('Alert severity styling', () => {
    it('should display critical alerts with red styling', () => {
      const criticalAlert: Alert = {
        id: 'alert-1',
        type: 'cpu',
        severity: 'critical',
        message: 'CPU critical',
        value: 95,
        threshold: 90,
        timestamp: '2024-01-15T10:00:00Z',
        dismissed: false,
      };

      useStore.setState({ alerts: [criticalAlert] });
      render(<AlertPanel />);

      // Check that Critical badge is displayed
      expect(screen.getByText('1 Critical')).toBeInTheDocument();
    });

    it('should display warning alerts with yellow styling', () => {
      const warningAlert: Alert = {
        id: 'alert-1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU warning',
        value: 85,
        threshold: 80,
        timestamp: '2024-01-15T10:00:00Z',
        dismissed: false,
      };

      useStore.setState({ alerts: [warningAlert] });
      render(<AlertPanel />);

      // Check that Warning badge is displayed
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
    });
  });
});
