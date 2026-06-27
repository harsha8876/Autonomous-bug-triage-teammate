import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lemma': {
        target: 'http://127-0-0-1.sslip.io:8711',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lemma/, ''),
      },
    },
  },
})
