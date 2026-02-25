import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['107-logo.jpg'],
      manifest: {
        name: 'Rebuilt Scouting',
        short_name: 'Scouting',
        description: 'FIRST Robotics scouting app',
        theme_color: '#1a1a2e',
        background_color: '#16213e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/107-logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
