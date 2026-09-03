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
        // Background Layer — from design.md §2
        'bg-base':     '#0D1117',
        'bg-elevated': '#161B22',
        'bg-overlay':  '#21262D',

        // Borders — from design.md §2
        'border-default': '#30363D',
        'border-subtle':  '#21262D',

        // Text — from design.md §2
        'text-primary':   '#E6EDF3',
        'text-secondary': '#8B949E',
        'text-muted':     '#484F58',

        // Accent & Status — from design.md §2
        accent:  '#2F81F7',
        'accent-hover': '#388BFD',
        success: '#3FB950',
        warning: '#D29922',
        danger:  '#F85149',
        info:    '#58A6FF',
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
        DEFAULT: '#30363D',
      },
      backgroundColor: {
        DEFAULT: '#0D1117',
      },
    },
  },
  plugins: [],
};

export default config;
