<div align="center">

# [🎞 YouTube Playlist Report](https://ytpr.netlify.app)

Generate comprehensive reports for YouTube playlists. Get insights on total duration, average video length, and detailed statistics for each video.

![desktop screenshot](./public/preview.png)

</div>

## ✨ Features

- Comprehensive Insights: Get detailed info about your playlists, including total duration, average video duration, number of videos, and specific details for each video.
- Playback Speed Adjustment: Customize your viewing experience by adjusting the playback speed from 0.25x to 2x.
- Flexible Sorting Options: Easily sort videos by position, duration, views, likes, or publish date.
- Efficient Filtering: Use the search bar to quickly filter and find specific videos within your playlist.
- Targeted Analysis: Analyze only the portions of the playlist that interest you with a range selector.
- Customizable Table View: Tailor your video table by toggling specific columns.

## 🧰 Tech used

- React
- TypeScript
- Vite
- React Router
- Tanstack Query
- Tailwind CSS
- Shadcn UI
- Framer Motion

## 💻 Setup Locally

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local`, then add your YouTube API key and Ko-fi page ID:
   ```
   VITE_YT_API_KEY=your_api_key_here
   VITE_KOFI_PAGE_ID=yourusername
   ```
4. Run the development server: `pnpm dev`
5. Open `http://localhost:5001` in your browser

## 📈 Self-hosted analytics with Counterscale

The app supports a patched, password-protected [Counterscale v3.4.1](https://github.com/benvinegar/counterscale/tree/v3.4.1) Worker on Cloudflare Free. Analytics remain disabled unless both public variables are present.

1. Deploy the pinned Worker using the [Cloudflare runbook](analytics/counterscale/README.md).
2. Set these variables in Netlify:
   ```
   VITE_COUNTERSCALE_REPORTER_URL=https://ytpr-data.<account>.workers.dev/collect
   VITE_COUNTERSCALE_SITE_ID=ytpr-production
   ```
3. Rebuild and deploy the app.

### GitHub stars indicator

The header loads the repository's star count from `/api/github-stars`. The
Netlify function fetches the count server-side and returns only
`{ "count": number }`. You can configure the optional `GITHUB_TOKEN` Netlify
environment variable to increase the GitHub API rate limit; the route also
works without it. Successful responses are cached for 24 hours and may remain
stale for one additional hour while the cache refreshes in the background.

Normal navigation is recorded as a pageview. A playlist path such as `/playlist/PLabc123` is recorded only after its complete report loads successfully, once per completed report view. Analytics failures never block report generation.

## ☕ Ko-fi support panel

The landing and successful report routes show a custom YTPR launcher for the
official Ko-fi tip panel. Ko-fi is loaded in an iframe only after the launcher
is opened. The embedded panel uses Ko-fi's account-controlled amount field; it
does not expose the `$5 / $15 / $25` preset buttons shown on the hosted page.
If the panel is blocked or times out, visitors can retry or open the hosted
Ko-fi page in a new tab.

Counterscale records one `/support/ko-fi/widget` exposure and the first
`/support/ko-fi/open` per eligible route view. Hosted fallback clicks use
`/outbound/ko-fi`. These synthetic paths include only `landing` or `report` as
their source and never include playlist IDs. Completed payments remain visible
in Ko-fi.

The versioned [Counterscale patch](analytics/counterscale/counterscale-v3.4.1.patch) adds the playlist leaderboard, exact-origin ingestion controls, bot suppression, and removes the R2 binding and archive cron.

## 🛣 Roadmap

- [x] Add tests

## 🌈 Inspiration

_To-do_

## 💡 Learnings

_To-do_

## 📜 License

[MIT](https://choosealicense.com/licenses/mit/)

## 💙 Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/), for the accessible and intuitive UI components
- [Syntax UI](https://syntaxui.com/) and [Aceternity UI](https://ui.aceternity.com/), for the beautiful Landing page components
- [YouTube Data API](https://developers.google.com/youtube/v3) for providing access to playlist data

<hr>

<div align="center">

<strong>⭐ Leave a star maybe? ⭐</strong><br>

<a href="https://github.com/buneeIsSlo/yt-playlist-report">Source</a>
| <a href="https://twitter.com/awwbhi2" target="_blank">Twitter</a>
| <a href="https://github.com/buneeIsSlo" target="_blank">GitHub</a>

</div>
