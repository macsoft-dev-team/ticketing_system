import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Make sure environment variables are available in development
    "import.meta.env.MODE": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "http://192.168.1.231:4052", // replace with your host PC’s LAN IP
    },
  },
});
