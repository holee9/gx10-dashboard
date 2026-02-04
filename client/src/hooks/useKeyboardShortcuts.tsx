import { useEffect, useCallback, useState } from 'react';

export type DashboardTab = 'overview' | 'performance' | 'storage' | 'network';

interface KeyboardShortcutsConfig {
  onTabChange?: (tab: DashboardTab) => void;
  onRefresh?: () => void;
  onToggleAdvanced?: () => void;
  onOpenSettings?: () => void;
  onToggleTheme?: () => void;
  onToggleShortcutsHelp?: () => void;
  enabled?: boolean;
}

interface ShortcutDefinition {
  key: string;
  description: string;
  category: 'navigation' | 'actions' | 'view';
}

export const SHORTCUTS: ShortcutDefinition[] = [
  { key: '1', description: 'Overview tab', category: 'navigation' },
  { key: '2', description: 'Performance tab', category: 'navigation' },
  { key: '3', description: 'Storage tab', category: 'navigation' },
  { key: '4', description: 'Network tab', category: 'navigation' },
  { key: 'r', description: 'Refresh data', category: 'actions' },
  { key: 'a', description: 'Toggle advanced view', category: 'view' },
  { key: 's', description: 'Open settings', category: 'actions' },
  { key: 't', description: 'Toggle theme', category: 'view' },
  { key: '?', description: 'Show shortcuts help', category: 'actions' },
  { key: 'Escape', description: 'Close dialogs', category: 'actions' },
];

export function useKeyboardShortcuts({
  onTabChange,
  onRefresh,
  onToggleAdvanced,
  onOpenSettings,
  onToggleTheme,
  onToggleShortcutsHelp,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (except for ?)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      switch (event.key) {
        case '1':
          event.preventDefault();
          onTabChange?.('overview');
          break;
        case '2':
          event.preventDefault();
          onTabChange?.('performance');
          break;
        case '3':
          event.preventDefault();
          onTabChange?.('storage');
          break;
        case '4':
          event.preventDefault();
          onTabChange?.('network');
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          onRefresh?.();
          break;
        case 'a':
        case 'A':
          event.preventDefault();
          onToggleAdvanced?.();
          break;
        case 's':
        case 'S':
          event.preventDefault();
          onOpenSettings?.();
          break;
        case 't':
        case 'T':
          event.preventDefault();
          onToggleTheme?.();
          break;
        case '?':
          event.preventDefault();
          setShowHelp((prev) => !prev);
          onToggleShortcutsHelp?.();
          break;
        case 'Escape':
          event.preventDefault();
          setShowHelp(false);
          break;
        default:
          break;
      }
    },
    [
      enabled,
      onTabChange,
      onRefresh,
      onToggleAdvanced,
      onOpenSettings,
      onToggleTheme,
      onToggleShortcutsHelp,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  const openHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  return {
    showHelp,
    closeHelp,
    openHelp,
    shortcuts: SHORTCUTS,
  };
}

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationShortcuts = SHORTCUTS.filter((s) => s.category === 'navigation');
  const actionShortcuts = SHORTCUTS.filter((s) => s.category === 'actions');
  const viewShortcuts = SHORTCUTS.filter((s) => s.category === 'view');

  return (
    <div
      className="shortcuts-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="shortcuts-modal">
        <div className="flex items-center justify-between mb-4">
          <h2 id="shortcuts-title" className="text-lg font-semibold text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gx-border/50 text-gray-400 hover:text-white transition-colors"
            aria-label="Close shortcuts help"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Navigation */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <div className="space-y-1">
              {navigationShortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.key} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* View */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              View
            </h3>
            <div className="space-y-1">
              {viewShortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.key} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Actions
            </h3>
            <div className="space-y-1">
              {actionShortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.key} shortcut={shortcut} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gx-border">
          <p className="text-xs text-gray-500 text-center">
            Press <span className="kbd">?</span> to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDefinition }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-300">{shortcut.description}</span>
      <span className="kbd">{shortcut.key}</span>
    </div>
  );
}

export default useKeyboardShortcuts;
