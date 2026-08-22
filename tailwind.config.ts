import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        space: {
          black: '#050810',
          navy: '#080f1e',
          deep: '#0a1628',
          panel: '#0d1a2e',
          border: '#1a2d4a',
          muted: '#2a3f5f',
          subtle: '#1e3050',
        },
        orbit: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          white: '#e8edf5',
          dim: '#8fa3be',
          accent: '#60a5fa',
        },
        status: {
          active: '#22c55e',
          cruise: '#3b82f6',
          science: '#a855f7',
          surface: '#f59e0b',
          extended: '#06b6d4',
          completed: '#64748b',
          unknown: '#374151',
        },
        planet: {
          earth: '#1e6fa5',
          moon: '#9ca3af',
          mars: '#c2410c',
          sun: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'space-gradient': 'radial-gradient(ellipse at center, #0a1628 0%, #050810 70%)',
        'panel-gradient': 'linear-gradient(135deg, rgba(13,26,46,0.9) 0%, rgba(8,15,30,0.95) 100%)',
        'glow-blue': 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59,130,246,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(59,130,246,0.6)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
