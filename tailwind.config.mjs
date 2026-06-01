/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'actor-user': 'rgb(var(--color-actor-user) / <alpha-value>)',
        'actor-client': 'rgb(var(--color-actor-client) / <alpha-value>)',
        'actor-auth': 'rgb(var(--color-actor-auth) / <alpha-value>)',
        'actor-resource': 'rgb(var(--color-actor-resource) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'rgb(var(--color-text))',
            fontSize: '1rem',
            lineHeight: '1.7',
            'h1, h2, h3, h4': {
              color: 'rgb(var(--color-text))',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              lineHeight: '1.3',
            },
            h2: { fontSize: '1.25rem', marginTop: '1.5em', marginBottom: '0.5em' },
            h3: { fontSize: '1.1rem', marginTop: '1.25em', marginBottom: '0.4em' },
            p: { marginTop: '1em', marginBottom: '1em' },
            strong: { color: 'rgb(var(--color-text))', fontWeight: '600' },
            a: {
              color: 'rgb(var(--color-text))',
              textDecoration: 'underline',
              textDecorationColor: 'rgb(var(--color-border))',
              textUnderlineOffset: '3px',
              textDecorationThickness: '1px',
              '&:hover': { textDecorationColor: 'rgb(var(--color-text))' },
            },
            code: {
              color: 'rgb(var(--color-text))',
              backgroundColor: 'rgb(var(--color-bg-secondary))',
              border: '1px solid rgb(var(--color-border))',
              padding: '0.15rem 0.35rem',
              borderRadius: '4px',
              fontWeight: '400',
              fontSize: '0.875em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
