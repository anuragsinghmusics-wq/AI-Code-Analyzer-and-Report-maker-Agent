import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background Layer
        'bg-base':     '#ffffff',
        'bg-elevated': '#fbfbfa',
        'bg-overlay':  '#f4f4f5',

        // Borders
        'border-default': '#e4e4e7',
        'border-subtle':  '#f4f4f5',

        // Text
        'text-primary':   '#09090b',
        'text-secondary': '#27272a',
        'text-muted':     '#52525b',

        // Accent & Status
        accent:  '#059669',
        'accent-hover': '#047857',
        'accent-mint': '#10b981',
        success: '#059669',
        warning: '#d97706',
        danger:  '#dc2626',
        info:    '#059669',
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '1.4' }],
        'sm':   ['13px', { lineHeight: '1.5' }],
        'base': ['15px', { lineHeight: '1.6' }],
        'lg':   ['18px', { lineHeight: '1.4' }],
        'xl':   ['24px', { lineHeight: '1.2' }],
        '2xl':  ['48px', { lineHeight: '1.0' }],
        '3xl':  ['72px', { lineHeight: '1.0' }],
      },
      borderColor: {
        DEFAULT: '#e4e4e7',
      },
      backgroundColor: {
        DEFAULT: '#ffffff',
      },
    },
  },
  plugins: [],
};

export default config;
