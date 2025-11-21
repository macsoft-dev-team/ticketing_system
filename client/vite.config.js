import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon/apple-touch-icon.png",
        "favicon/favicon-96x96.png",
      ],
      manifest: {
        name: "Macsoft CMS",
        short_name: "CMS",
        description: "Macsoft Customer Management System",
        start_url: "/", // 👈 important for installability
        display: "standalone", // 👈 opens like an app (no browser UI)
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/favicon/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/assets/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/assets/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/assets/icon-256x256.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "/assets/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Macsoft CMS Desktop View",
          },
          {
            src: "/favicon/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            form_factor: "narrow",
            label: "Macsoft CMS Mobile View",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // Increase the maximum file size limit to 5MB to handle large bundles
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Runtime caching for better performance
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      // Disable dev options to prevent dev-dist folder creation
      devOptions: {
        enabled: false,
      },
    }),
  ],
  define: {
    "import.meta.env.MODE": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  build: {
    // Clean output directory before build
    emptyOutDir: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting
        manualChunks: {
          // Vendor chunks for large dependencies
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['lucide-react', 'motion'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'socket-vendor': ['socket.io-client'],
          'moment-vendor': ['moment'],
          'utils-vendor': ['axios', 'xlsx', '@zxing/library', 'bcryptjs', 'tailwind-merge'],
        },
      },
    },
    // Enable source maps for production debugging (optional, can be disabled for smaller builds)
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    // Minification settings
    minify: 'esbuild',
    target: 'es2020',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "http://localhost:4055",
    },
    allowedHosts: ["localhost", "aphyllous-unseducibly-solange.ngrok-free.dev"],
  },
});
