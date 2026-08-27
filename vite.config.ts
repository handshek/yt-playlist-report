import path from "path"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5001,
  }
})
