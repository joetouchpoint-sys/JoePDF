import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// pdf.worker.min.js is copied into public/ by the prebuild/predev npm script
// (see package.json "copy-worker"). Vite serves public/ files at the root URL,
// so the worker is available at /pdf.worker.min.js at runtime.
const base = process.env['VITE_BASE_URL'] ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('pdfjs-dist')) return 'pdfjs'
          if (id.includes('pdf-lib')) return 'pdf-lib'
          if (id.includes('docx')) return 'docx'
          if (id.includes('konva')) return 'konva'
          if (id.includes('react') || id.includes('zustand') || id.includes('immer')) return 'vendor'
          return undefined
        },
      },
    },
  },
})
