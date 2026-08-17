import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
=======
import path from 'path'
>>>>>>> origin/Trivedi-branch

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
=======
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
>>>>>>> origin/Trivedi-branch
  server: {
    port: 5173,
    host: true
  }
})
