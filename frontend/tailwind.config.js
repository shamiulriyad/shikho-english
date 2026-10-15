import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Shikho English brand palette (see docs/BRAND.md)
      colors: {
        brand: {
          forest: '#173B35',
          ivory: '#F7F5EF',
          terracotta: '#A84F2D',
          amber: '#D99B3D',
        },
        // Text, surfaces and feedback. Every text colour here meets WCAG AA (4.5:1) on paper, white and the soft tints.
        ink: { DEFAULT: '#1C2925', muted: '#56625E' },
        paper: '#F7F5EF',
        // `line` separates content; `line-strong` outlines form controls (3:1 against paper and white)
        line: { DEFAULT: 'rgb(23 59 53 / 0.14)', strong: '#7F8B87' },
        info: { DEFAULT: '#173B35', soft: '#E6EEEB' },
        success: { DEFAULT: '#2B6A4B', soft: '#E6F0EA' },
        warning: { DEFAULT: '#7A5510', soft: '#FAF0DC' },
        // Deliberately cooler than terracotta so errors never read as a call to action
        danger: { DEFAULT: '#9E2A3A', soft: '#F8E8EA' },
      },
      fontSize: {
        display: ['clamp(2.25rem, 5vw, 3.5rem)', { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' }],
        h1: ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '700' }],
        h3: ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      boxShadow: {
        paper: '0 1px 2px rgb(23 59 53 / 0.06), 0 1px 1px rgb(23 59 53 / 0.04)',
      },
      maxWidth: {
        reading: '42rem',
        page: '72rem',
      },
      // Restrained motion only; prefers-reduced-motion switches all of it off (see index.css)
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        caret: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      animation: {
        rise: 'rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        fade: 'fade 0.35s ease-out both',
        caret: 'caret 1.1s steps(1) infinite',
      },
      // Inter has no Bengali glyphs, so Bangla text falls through to Hind Siliguri
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', ...defaultTheme.fontFamily.sans],
        bangla: ['Hind Siliguri', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
