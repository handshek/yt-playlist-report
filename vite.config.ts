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
    // Use the loopback interface so local tooling does not depend on IPv6 resolution.
    host: "127.0.0.1",
    port: 5001,
  }
})
