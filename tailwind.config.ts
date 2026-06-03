import type { Config } from 'tailwindcss';

// Colors are wired to CSS variables (defined in src/index.css) so the design-token
// layer stays the single source of truth and themes swap without recompiling.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        reward: 'var(--reward)',
        correct: 'var(--correct)',
        incorrect: 'var(--incorrect)',
        info: 'var(--info)',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h1: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2: ['1.5rem', { lineHeight: '1.15' }],
        h3: ['1.25rem', { lineHeight: '1.2' }],
        body: ['1.0625rem', { lineHeight: '1.55' }],
        small: ['0.9375rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
      },
      maxWidth: {
        column: 'var(--maxw)',
      },
    },
  },
  plugins: [],
};

export default config;
