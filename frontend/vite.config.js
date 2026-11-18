import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000'
  return {
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '0.0.0.0',
    proxy: Object.fromEntries(['/auth', '/patients', '/images', '/predictions'].map((path) => [path, { target: apiOrigin, changeOrigin: true }])),
  },
  }
})
