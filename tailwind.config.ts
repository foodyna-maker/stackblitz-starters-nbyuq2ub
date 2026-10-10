import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Scala colori della chiesa
        church: {
          deep: '#2B6B55', // Verde profondo: testi primari scuri, titoli autorevoli, accenti solidi
          emerald: '#2D8B6F', // Verde liturgico/primario: pulsanti CTA, link attivi, badge
          sage: '#8AAE9E', // Salvia medio: testi secondari, bordi neutri, icone
          soft: '#CFE6CC', // Menta delicato: card alternate, divider, pillole attive
          mist: '#DCEFDA', // Sfondo panna/menta chiarissimo: sezioni soft, hover state
        },
        // Token semantici pronti all'uso
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#DCEFDA',
          muted: '#CFE6CC',
        },
        brand: {
          DEFAULT: '#2D8B6F',
          dark: '#2B6B55',
          light: '#8AAE9E',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
