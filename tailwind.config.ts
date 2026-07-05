import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e8eeff',
          500: '#4a5fc1',
          600: '#3b4ea3',
          700: '#2f3f85',
        },
      },
    },
  },
  plugins: [],
};

export default config;
