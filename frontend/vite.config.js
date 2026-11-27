import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.VITE_BACKEND_HOST || 'http://localhost'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/auth': {
          target: `${host}:8001`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/auth/, '/auth'),
        },
        '/api/flights': {
          target: `${host}:8002`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/flights/, '/flights'),
        },
        '/api/bookings': {
          target: `${host}:8003`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bookings/, '/bookings'),
        },
        '/api/private-jets': {
          target: `${host}:8004`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/private-jets/, '/private-jets'),
        },
        '/api/admin': {
          target: `${host}:8005`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/admin/, '/admin'),
        },
      },
    },
  }
})
