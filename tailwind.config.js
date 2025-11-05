export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-line': 'glow 2s ease-in-out infinite',
        'glow-line-delayed': 'glow 2s ease-in-out 1s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 0.8 }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  }
}