import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build version from environment or generated timestamp
const appVersion = process.env.VITE_APP_VERSION || String(Date.now());

function versionPlugin() {
  return {
    name: "vite-plugin-version-generator",
    buildStart() {
      try {
        const publicDir = path.resolve(__dirname, "public");
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const versionData = {
          version: appVersion,
          buildTime: new Date().toISOString(),
        };
        fs.writeFileSync(
          path.resolve(publicDir, "version.json"),
          JSON.stringify(versionData, null, 2)
        );
      } catch (err) {
        console.warn("Could not write public/version.json:", err);
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = req.url?.split("?")[0];
        if (cleanUrl === "/version.json") {
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
          );
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.end(
            JSON.stringify({
              version: appVersion,
              buildTime: new Date().toISOString(),
            })
          );
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify(
          {
            version: appVersion,
            buildTime: new Date().toISOString(),
          },
          null,
          2
        ),
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    versionPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon/favicon.ico",
        "favicon/apple-touch-icon.png",
        "favicon/favicon-96x96.png",
      ],    
      workbox: {
        globPatterns: ["**/*.{js,css,html}"],
        // Increase the maximum file size limit to accommodate current bundle size
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB
        // Skip caching large files and media
        globIgnores: [
          '**/version.json', // Must not be precached by service worker
          '**/node_modules/**/*',
          '**/sounds/**/*',
          '**/images/**/*',
          '**/assets/icon-512x512.png',
          '**/assets/icon-384x384.png',
          '**/assets/icon-256x256.png',
          '**/*.{mp3,wav,ogg,mp4,webm,avi}',
          '**/file-utils-*.js', // Skip large file utility chunks
          '**/excel-utils-*.js', // Skip Excel utilities
          '**/charts-*.js', // Skip chart libraries from precaching
        ],
        // Minimal runtime caching
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 25, // Further reduced
                maxAgeSeconds: 60 * 60 * 6, // 6 hours only
              },

            },
          },
          {
            // Cache only small images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'img-cache',
              expiration: {
                maxEntries: 15, // Very limited image cache
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days only
              },

            },
          },
        ],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for faster updates
        skipWaiting: true,
        clientsClaim: true,
      },
      // Disable dev options to prevent dev-dist folder creation
      devOptions: {
        enabled: false,
      },
    }),
  ],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.MODE": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  build: {
    // Clean output directory before build
    emptyOutDir: true,
    // Reduce chunk size warning limit for smaller bundles
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting and smaller chunks
        manualChunks: {
          // Core React (keep small and separate)
          'react-core': ['react', 'react-dom'],
          // Router (frequently used)
          'router': ['react-router-dom'],
          // State management
          'redux': ['@reduxjs/toolkit', 'react-redux'],
          // UI components (split into smaller chunks)
          'ui-icons': ['lucide-react'],
          'ui-motion': ['motion'],
          // Charts (large, keep separate and lazy load)
          'charts': ['recharts'],
          // Forms (moderate size)
          'forms': ['react-hook-form', '@hookform/resolvers', 'yup'],
          // Socket (keep separate as it's not always needed)
          'socket': ['socket.io-client'],
          // Date utilities
          'date-utils': ['moment'],
          // Split large file utilities
          'excel-utils': ['xlsx'],
          'qr-utils': ['@zxing/library'],
          // HTTP utilities
          'http-utils': ['axios'],
          'crypto-utils': ['bcryptjs'],
          'style-utils': ['tailwind-merge'],
        },
        // Add chunk size limits to prevent large chunks from being cached
        chunkFileNames: (chunkInfo) => {
          // Use shorter names for smaller cache footprint
          return `[name]-[hash:6].js`;
        },
        assetFileNames: (assetInfo) => {
          // Organize assets for better cache management
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash:6][extname]`;
          }
          if (/css/i.test(extType)) {
            return `styles/[name]-[hash:6][extname]`;
          }
          return `assets/[name]-[hash:6][extname]`;
        },
      },
    },
    // Disable source maps for smaller builds and reduced cache
    sourcemap: false,
    // Optimize CSS with better splitting
    cssCodeSplit: true,
    // Aggressive minification
    minify: 'esbuild',
    target: 'es2020',
    // Optimize assets
    assetsInlineLimit: 4096, // Inline small assets (4KB limit)
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "http://localhost:3057",
    },
    allowedHosts: ["localhost"],
  },
});
