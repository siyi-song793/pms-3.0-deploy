import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  root: process.cwd(),
  // 使用相对路径，确保 dist/index.html 可直接通过 file:// 协议打开运行
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['localforage', 'idb']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@common': path.resolve(__dirname, './src/common'),
      '@service': path.resolve(__dirname, './src/service'),
      '@db': path.resolve(__dirname, './src/db'),
      '@module': path.resolve(__dirname, './src/module')
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // 关闭自动注入注册脚本：file:// 协议下 SW 无法注册，避免控制台报错
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{html,js,css,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.pages\.dev\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'pms-3-0-global-cache' }
          }
        ]
      },
      manifest: {
        name: '个人时间管理系统3.0',
        short_name: 'PMS3.0',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f7f8fa',
        theme_color: '#2E7D32',
        icons: [
          { src: './favicon/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './favicon/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true }
})
