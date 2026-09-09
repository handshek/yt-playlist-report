import path from "path"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig, type Plugin } from "vite"
import { handler } from "./netlify/functions/github-stars"

const localGithubStarsApi = (): Plugin => ({
  name: "local-github-stars-api",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url?.split("?", 1)[0] !== "/api/github-stars") {
        next()
        return
      }

      const result = await handler({ httpMethod: request.method })
      response.statusCode = result.statusCode

      for (const [name, value] of Object.entries(result.headers)) {
        response.setHeader(name, value)
      }

      response.end(result.body)
    })
  },
})

export default defineConfig({
  plugins: [localGithubStarsApi(), reactRouter()],
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
