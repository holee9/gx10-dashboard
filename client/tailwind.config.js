/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Static accent colors - explicit values allow opacity modifiers
        'gx-cyan': '#00d9ff',
        'gx-green': '#3fb950',
        'gx-yellow': '#d29922',
        'gx-red': '#f85149',
        'gx-purple': '#a371f7',
        // Legacy support - explicit values for compatibility
        'gx-dark': '#0d1117',
        'gx-card': '#161b22',
        'gx-border': '#30363d',
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
