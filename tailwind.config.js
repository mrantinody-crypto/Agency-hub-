/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ECECEE',
        sidebar: '#F5F5F7',
        card: '#FFFFFF',
        hairline: '#D9D9DE',
        ink: {
          primary: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#9A9AA0',
        },
        sysblue: '#0A84FF',
        sysbluedeep: '#0060DF',
        traffic: {
          red: '#FF5F57',
          yellow: '#FEBC2E',
          green: '#28C840',
        },
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', '"Inter"', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"Inter"', 'sans-serif'],
        mono: ['"SF Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        window: '12px',
        card: '10px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        pop: '0 12px 32px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
