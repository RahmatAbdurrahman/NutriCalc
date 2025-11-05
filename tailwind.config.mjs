/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // --- KODE ANDA DITARUH DI SINI ---
      keyframes: {
        floatAndRotate: {
          '0%, 100%': { transform: 'translateY(0) rotateZ(0deg)' },
          '25%': { transform: 'translateY(-5px) rotateZ(1deg)' },
          '75%': { transform: 'translateY(5px) rotateZ(-1deg)' },
        },
        pulseLight: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.1)', opacity: '0.7' },
        }
      },
      animation: {
        floatAndRotate: 'floatAndRotate 4s ease-in-out infinite',
        pulseLight: 'pulseLight 3s ease-in-out infinite',
      }
      // --- BATAS AKHIR KODE ---
    },
  },
  plugins: [],
};

export default config;