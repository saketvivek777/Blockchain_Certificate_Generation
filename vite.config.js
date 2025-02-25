// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//     optimizeDeps: {
//     exclude: ['lucide-react'],
//     base:"/Blockchain_Based_Certification_React_app/",
//     build:{
//       chunkSizeWarningLimit:2000,
//     }
//     }
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/Blockchain_Certificate_Generation/",
  build: {
    chunkSizeWarningLimit: 2000, // Increase the chunk size limit (Default: 500KB)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("html2canvas")) {
              return "html2canvas"; // Separate html2canvas into its own chunk
            }
            return "vendor"; // Separate vendor libraries
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  }
})
