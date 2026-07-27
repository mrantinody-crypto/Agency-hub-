/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAF8',
        sidebar: '#F4F3EF',
        card: '#FFFFFF',
        hairline: '#D9D9DE',
        ink: {
          primary: '#18181B',
          secondary: '#5E5E66',
          tertiary: '#8E8E96',
        },
        sysblue: '#0A84FF',
        sysbluedeep: '#0060DF',
        traffic: {
          red: '#FF5F57',
          yellow: '#FEBC2E',
          green: '#28C840',
        },
      },
      boxShadow: {
        panel: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        pop: '0 12px 32px rgba(0,0,0,0.14)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        window: '16px',
        card: '12px',
      },
    },
  },
  plugins: [],
}
