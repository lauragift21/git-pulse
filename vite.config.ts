import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    proxy: {
      // Proxy OAuth routes to the Wrangler dev server during local development
      "/auth": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
