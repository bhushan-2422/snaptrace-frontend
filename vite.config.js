import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://13.235.81.23',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://13.235.81.23',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://13.235.81.23',
        changeOrigin: true,
      },
    },
  },
})
