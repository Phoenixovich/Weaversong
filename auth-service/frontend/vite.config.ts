import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy CityPulse API calls to the backend (but not the page route /citypulse)
      '/citypulse/alerts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/citypulse/sectors': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Premium analyze endpoint (separate from citypulse)
      '/analyze': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/helpboard': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/pedestrian': {
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

