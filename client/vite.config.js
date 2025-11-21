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
      includeAssets: ["favicon.ico", "favicon/apple-touch-icon.png", "favicon/favicon-96x96.png"],
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
          }
        ],
        screenshots: [
          {
            src: "/assets/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Macsoft CMS Desktop View"
          },
          {
            src: "/favicon/web-app-manifest-192x192.png",
            sizes: "192x192", 
            type: "image/png",
            form_factor: "narrow",
            label: "Macsoft CMS Mobile View"
          }
        ],
      },
      // Optional but useful for testing PWA in dev:
      devOptions: {
        enabled: true,
      },
    }),
  ],
  define: {
    "import.meta.env.MODE": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "http://localhost:4055",
    },
  },
});
