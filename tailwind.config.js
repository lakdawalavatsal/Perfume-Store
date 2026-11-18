/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: {
            950: '#041610',
            900: '#07241A',
            850: '#0B3024',
            800: '#114132',
            700: '#1A5744',
            600: '#23735B',
          },
          ivory: {
            50: '#FCFBF9',
            100: '#FAF7F2',
            200: '#F4EFE6',
            300: '#EBE3D4',
            400: '#DACDB7',
          },
          gold: {
            100: '#FBF5E2',
            200: '#F4E4B5',
            300: '#E7CE81',
            400: '#D4AF37',
            500: '#C19827',
            600: '#A47D1A',
            700: '#7E5F11',
          }
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-soft': '0 4px 20px -2px rgba(212, 175, 55, 0.15)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
        'emerald-deep': '0 20px 40px -15px rgba(4, 22, 16, 0.7)',
        'luxury-card': '0 10px 30px -5px rgba(11, 48, 36, 0.08), 0 4px 6px -2px rgba(11, 48, 36, 0.04)',
      },
      animation: {
        'slow-pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
