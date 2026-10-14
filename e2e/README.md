# Check the playlist-to-report journey

Install the locked dependencies and test browsers, then run the browser checks.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

The suite starts its own development server at `http://127.0.0.1:5117` and stops
that server afterward. An occupied port fails the run rather than attaching to
another checkout. Chromium covers desktop use. WebKit with a 375px iPhone
viewport covers mobile layout and touch input. This is browser emulation, not
a physical-device test.

Each test starts with fresh browser storage. The suite intercepts the existing
`POST /api/youtube-playlist` boundary and checks its method, playlist ID, and
resource before returning deterministic fixtures. It also intercepts the
GitHub stars request. YouTube credentials are not required. These checks prove
the frontend behavior, not live YouTube availability. The tests in
`tests/youtube-playlist-function.test.ts` cover upstream API handling separately.

The four-video fixture contains videos lasting 1, 2, 3, and 4 minutes. Assertions
use literal totals rather than calling production calculation helpers. The suite
covers generation and reload, pending responses, speed and inclusive range
selection, mobile touch input, invalid URLs, private playlists, retry recovery,
missing thumbnails, empty reports, and durations that include days. A separate
check verifies that an aborted API request does not terminate the local server.

Run a focused check with a title filter.

```sh
pnpm test:e2e --grep 'range'
pnpm test:e2e --project=mobile
```

Failures retain screenshots and traces in `test-results/`. Successful report,
range, and recovery checks also save screenshots there. The HTML report lives
in `playwright-report/`. To preserve one run separately, set
`PLAYWRIGHT_OUTPUT_DIR` to a new directory before running the command. Both
default output directories are ignored by Git.

```sh
pnpm exec playwright show-report
pnpm exec playwright show-trace test-results/<failed-test>/trace.zip
```

Run the existing checks before handing off a change.

```sh
pnpm test
pnpm lint
pnpm test:seo
```

`pnpm test:seo` includes the TypeScript checks and production build. Browser
tests are separate from Vitest and run against the local development server.
