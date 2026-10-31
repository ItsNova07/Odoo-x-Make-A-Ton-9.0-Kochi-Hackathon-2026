import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages hosts this repository under /<REPOSITORY_NAME>/.
export default defineConfig({
  base: "/Odoo-x-Make-A-Ton-9.0-Kochi-Hackathon-2026/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
