import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Set VITE_BASE_URL=/JoePDF/ when building for GitHub Pages
const base = process.env['VITE_BASE_URL'] ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          // Rename .mjs → .js so GitHub Pages serves it with application/javascript
          // MIME type. Chrome rejects workers with incorrect MIME types.
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          dest: '',
          rename: 'pdf.worker.min.js',
        },
      ],
    }),
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
