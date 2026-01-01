// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5f0',
          100: '#f4e8dc',
          200: '#e9d1b9',
          300: '#ddb28e',
          400: '#d19162',
          500: '#c97644',
          600: '#bb6239',
          700: '#9b4d31',
          800: '#7d3f2d',
          900: '#663526',
          950: '#371913',
        },
        coffee: {
          light: '#D4A574',
          medium: '#8B4513',
          dark: '#3E2723',
        },
      },
    },
  },
  plugins: [],
};

export default config;