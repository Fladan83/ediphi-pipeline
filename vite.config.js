import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // In local dev, proxy /api calls to the Vercel dev server
      // Run: npx vercel dev (or use the env vars directly)
    }
  }
})
