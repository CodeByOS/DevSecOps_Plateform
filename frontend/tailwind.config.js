/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0f1117',
        'bg-card': '#16202a',
        'bg-elevated': '#1d2d3d',
        'bg-hover': '#252f3d',
        'border-main': '#3a4654',
        'border-subtle': '#252f3d',
        'text-primary': '#e8ecf1',
        'text-secondary': '#c5ccd6',
        'text-muted': '#8b96a6',
        'brand-blue': {
          DEFAULT: '#4fa3ff',
          dim: '#1a3a5f',
          light: '#6bb3ff',
          dark: '#2d6ba6',
        },
        'brand-green': {
          DEFAULT: '#42c77f',
          dim: '#1a4d35',
        },
        'brand-red': {
          DEFAULT: '#f17a5f',
          dim: '#4a2520',
        },
        'brand-orange': {
          DEFAULT: '#e8a844',
          dim: '#4d3a1a',
        },
        'brand-purple': {
          DEFAULT: '#c5a3ff',
          dim: '#3a2e5f',
        },
        'severity-critical': '#f17a5f',
        'severity-high': '#e8a844',
        'severity-medium': '#f0c95f',
        'severity-low': '#8b96a6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 0 1px #3a4654, 0 8px 32px rgba(79, 163, 255, 0.12)',
        'glow-hover': '0 8px 24px rgba(79, 163, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
