import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', 
      injectRegister: 'auto',
      manifest: false, // <--- CRÍTICO: Apaga el manifiesto estático para no pisar tu código dinámico
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'], // Guarda los assets en caché para modo offline
        cleanupOutdatedCaches: true,
        sourcemap: true,
        navigateFallback: 'index.html', // <--- CRÍTICO PARA REACT ROUTER OFFLINE
        navigateFallbackAllowlist: [/^(?!\/__).*/]
      }
    })
  ],
})