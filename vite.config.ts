import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loaded on every page
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase - needed for auth
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // UI Framework
          'vendor-ui': ['framer-motion', 'lucide-react', '@headlessui/react'],
          // Query/State
          'vendor-query': ['@tanstack/react-query', 'zustand'],
          // Charts - only on dashboard/analytics pages
          'vendor-charts': ['recharts', 'chart.js', 'react-chartjs-2'],
          // PDF - only on CV/resume pages
          'vendor-pdf': ['pdfjs-dist', 'react-pdf', '@react-pdf/renderer', 'jspdf'],
          // Editor - only on notes/editor pages
          'vendor-editor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-underline'
          ],
          // Whiteboard - only on whiteboard page
          'vendor-tldraw': ['tldraw'],
          // 3D - only on mock interview intro
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          // Date utils
          'vendor-date': ['date-fns'],
        }
      }
    },
    cssCodeSplit: true,
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 500,
    sourcemap: false
  }
})
