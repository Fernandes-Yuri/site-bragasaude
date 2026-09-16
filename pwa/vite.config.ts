import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/app/',
  build: {
    outDir: '../onboarding_site/public/app',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Braga Saúde — Modo Cuidador',
        short_name: 'Braga Cuidador',
        description: 'Acompanhamento em tempo real da saúde e bem-estar dos seus familiares',
        theme_color: '#059669',
        background_color: '#064e3b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/app/',
        scope: '/app/',
        icons: [
          {
            src: '/app/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/app/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/app/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})

