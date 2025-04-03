import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API requests to your FastAPI backend
      "/analyze": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/analysis": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
