/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Static accent colors - muted for deep dark theme
        'gx-cyan': '#00b8d9',
        'gx-green': '#2da44e',
        'gx-yellow': '#bf8700',
        'gx-red': '#e5534b',
        'gx-purple': '#8b5cf6',
        // Deep dark theme colors
        'gx-dark': '#000000',
        'gx-card': '#0a0d12',
        'gx-border': '#1e2228',
      },
      backgroundColor: {
        'themed-primary': 'var(--bg-primary)',
        'themed-card': 'var(--bg-card)',
        'themed-card-hover': 'var(--bg-card-hover)',
      },
      textColor: {
        'themed-primary': 'var(--text-primary)',
        'themed-secondary': 'var(--text-secondary)',
        'themed-muted': 'var(--text-muted)',
      },
      borderColor: {
        'themed': 'var(--border-color)',
        'themed-light': 'var(--border-color-light)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionProperty: {
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow',
      },
    },
  },
  plugins: [],
};
