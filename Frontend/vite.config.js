import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configure dev proxy so frontend calls to /api are forwarded to backend server
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
      ,
      // Allow loading candidate photos stored on backend
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  // Opt into upcoming React Router v7 behaviours to silence warnings early (harmless now)
  define: {
    'process.env': {}
  }
})
