import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy CityPulse and helpboard API calls to the backend during development
      '/citypulse': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/helpboard': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})

