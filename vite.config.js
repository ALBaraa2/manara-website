import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // three تُحمَّل بـ import ديناميكي (المشهد ثلاثي الأبعاد في الواجهة الأولى)، فنجهّزها مسبقاً
  // حتى لا يكتشفها خادم التطوير متأخراً ويعيد تحميل الصفحة
  optimizeDeps: {
    include: ['three', 'three/addons/objects/Reflector.js'],
  },

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      // طلبات الـ API والملفات تُخدم من Laravel على نفس الأصل؛ بدون هذا الاستثناء
      // كان الـ service worker يعيد index.html عند فتح روابط الملفات أو CSV في تبويب جديد
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/storage\//, /^\/sanctum\//],
      },

      manifest: {
        id: '/',
        name: 'Manara',
        short_name: 'Manara',
        description: 'Manara Platform',

        start_url: '/',
        display: 'standalone',

        background_color: '#ffffff',
        theme_color: '#ffffff',

        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})