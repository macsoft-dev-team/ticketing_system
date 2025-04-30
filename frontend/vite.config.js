import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensures output is in the 'dist' directory
  },

})



// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';


// export default defineConfig({
//   plugins: [react()],
//   build: {
//     outDir: 'dist',
//   },
//   server: {
//     host: 'cri.macsoftautomations.in', 
//     port: 3000, 
//     https: true, 
//   },
// });
