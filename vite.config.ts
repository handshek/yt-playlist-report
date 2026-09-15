import path from "path"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { handler } from "./netlify/functions/github-stars"
import { handleYoutubePlaylistRequest as youtubePlaylistHandler } from "./netlify/functions/youtube-playlist"

const readRequestBody = (request: import("node:http").IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    request.on("error", reject)
  })

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

const localYoutubePlaylistApi = (): Plugin => ({
  name: "local-youtube-playlist-api",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url?.split("?", 1)[0] !== "/api/youtube-playlist") {
        next()
        return
      }

      const result = await youtubePlaylistHandler({
        httpMethod: request.method,
        headers: Object.fromEntries(
          Object.entries(request.headers).map(([name, value]) => [
            name,
            Array.isArray(value) ? value.join(",") : value,
          ])
        ),
        body: await readRequestBody(request),
      })
      response.statusCode = result.statusCode

      for (const [name, value] of Object.entries(result.headers)) {
        response.setHeader(name, value)
      }

      response.end(result.body)
    })
  },
})

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "")
  // Local middleware needs the same server-only secret used by Netlify Functions.
  process.env.YT_API_KEY ??=
    environment.YT_API_KEY || environment.VITE_YT_API_KEY

  return {
    plugins: [localGithubStarsApi(), localYoutubePlaylistApi(), reactRouter()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Use the loopback interface so local tooling does not depend on IPv6 resolution.
      host: "127.0.0.1",
      port: 5001,
    },
  }
})
