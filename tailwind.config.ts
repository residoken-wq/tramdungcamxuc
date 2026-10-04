import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    // THAY THẾ TOÀN BỘ BẢNG MÀU MẶC ĐỊNH (KHÔNG DÙNG extend)
    // Chỉ cho phép đúng 8 token màu Brand Book 2026 + white, transparent, current
    colors: {
      white: '#FFFFFF',
      transparent: 'transparent',
      current: 'currentColor',
      'deep-navy': 'rgb(var(--color-deep-navy-rgb) / <alpha-value>)',
      'bright-magenta': 'rgb(var(--color-bright-magenta-rgb) / <alpha-value>)',
      'accent-pink': 'rgb(var(--color-accent-pink-rgb) / <alpha-value>)',
      'soft-pink': 'rgb(var(--color-soft-pink-rgb) / <alpha-value>)',
      'lavender-mist': 'rgb(var(--color-lavender-mist-rgb) / <alpha-value>)',
      'mint-haze': 'rgb(var(--color-mint-haze-rgb) / <alpha-value>)',
      'butter-cream': 'rgb(var(--color-butter-cream-rgb) / <alpha-value>)',
      'warm-ivory': 'rgb(var(--color-warm-ivory-rgb) / <alpha-value>)',
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Anton', 'sans-serif'],
        ui: ['var(--font-ui)', 'Montserrat', 'sans-serif'],
        sans: ['var(--font-ui)', 'Montserrat', 'sans-serif'],
        quote: ['var(--font-quote)', 'Playfair Display', 'serif'],
      },
      spacing: {
        'breath-sm': '16px',
        'breath-md': '24px',
        'breath-lg': '32px',
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(40, 10, 96, 0.06)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, var(--color-lavender-mist) 0%, var(--color-soft-pink) 35%, var(--color-butter-cream) 70%, var(--color-warm-ivory) 100%)',
      },
    },
  },
  plugins: [],
}

export default config
