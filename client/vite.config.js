import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Конфиг Vite. В dev-режиме проксируем /api на бекенд (порт 4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
