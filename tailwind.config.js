/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-montserrat)', 'sans-serif'],
        'montserrat': ['var(--font-montserrat)', 'sans-serif'],
      },
      fontSize: {
        'heading-1': ['48px', '50px'],
        'heading-2': ['36px', '40px'],
        'heading-3': ['24px', '28px'],
        'heading-4': ['20px', '26px'],
        'heading-5': ['18px', '22px'],
        'body': ['16px', '26px'],
        'caption': ['12px', '16px'],
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        // Primary Colors
        'white': '#FFFFFF',
        'unifying-blue': '#003D5B',
        'jade-green': '#007380',
        
        // Secondary Colors - Seafoam Teal variants
        'seafoam': {
          100: '#25E2CC', // Base Seafoam Teal
          80: '#51EBD6',   // 80%
          60: '#7CEEE0',   // 60%
          40: '#A8F3EB',   // 40%
          20: '#D3F9F5',   // 20%
          10: '#E9FCFA',   // 10%
        },
        
        // Accent Colors
        'tangerine': {
          100: '#FF8400', // Tangerine Orange
          20: '#FFE6CC',  // 20%
        },
        'sunshine': {
          100: '#FBCA18', // Sunshine Yellow
          20: '#FEF4D1',  // 20%
        },
        'raspberry': '#CC3262', // Raspberry Pink
        
        // Text Colors
        'light-gray': '#F2F2F2',
        'text-gray': '#2A2B2C',
      }
    },
  },
  plugins: [],
}