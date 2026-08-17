import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // PORT ortam değişkeni verilirse onu kullan (önizleme aracı için);
  // yoksa Vite'ın varsayılan portu (5173) geçerli olur.
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
})
