import { useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'gx10-theme';

function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  // Check system preference (with null safety for test environments)
  try {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      if (mediaQuery && mediaQuery.matches) {
        return 'light';
      }
    }
  } catch {
    // Ignore matchMedia errors in test environments
  }

  // Default to dark
  return 'dark';
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    // Skip in test environments where matchMedia is not fully supported
    if (!window.matchMedia) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      if (!mediaQuery) return;

      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply system preference if user hasn't manually set a theme
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!stored) {
          setThemeState(e.matches ? 'light' : 'dark');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // Ignore matchMedia errors in test environments
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}

// Sun icon for light mode
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

// Moon icon for dark mode
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    toggleTheme();

    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 300);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={handleClick}
      className={`
        relative p-1.5 rounded-lg
        hover:bg-gx-border/50
        text-gray-400 hover:text-white
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gx-cyan
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode (T)' : 'Switch to dark mode (T)'}
    >
      <div
        className={`
          theme-toggle-icon w-4 h-4
          ${isAnimating ? 'entering' : ''}
        `}
      >
        {isDark ? (
          <MoonIcon className="w-4 h-4" />
        ) : (
          <SunIcon className="w-4 h-4" />
        )}
      </div>
    </button>
  );
}

export default ThemeToggle;
