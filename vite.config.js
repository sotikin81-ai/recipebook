import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // В продакшне фронт и бэкенд на одном домене,
  // поэтому API_URL просто пустая строка (относительные пути)
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000/api"
    ),
  },
  server: {
    // В dev-режиме проксируем /api на бэкенд
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
