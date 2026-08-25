# Counterscale on Cloudflare Free

This deployment uses the exact Counterscale `v3.4.1` tag and the repository patch at `analytics/counterscale/counterscale-v3.4.1.patch`. It does not use the `@latest` installer, R2, or a cron trigger.

## Before you start

You need a free Cloudflare account with a Workers subdomain and Analytics Engine enabled. Create an API token with `Account Analytics: Read`; this is the token Counterscale uses to query its dashboard data. Wrangler login separately authorizes deployment.

The Counterscale "binary" is a continuously running server executable. Netlify and Vercel provide short-lived functions, not a persistent process with durable local storage, so that approach is not a fit there. The customized Cloudflare Worker is serverless, has no cold-starting container, and needs no VPS.

## 1. Prepare the pinned source

Choose a new, empty destination outside this repository:

```bash
./analytics/counterscale/prepare.sh /tmp/ytpr-counterscale-v3.4.1
cd /tmp/ytpr-counterscale-v3.4.1
```

The script clones tag `v3.4.1`, verifies and applies the patch, installs the frozen lockfile, and runs the Worker tests, build, and type-check.

## 2. Log in and configure Worker secrets

```bash
corepack pnpm@9.15.0 --filter @counterscale/server exec wrangler login
corepack pnpm@9.15.0 --filter @counterscale/cli build
corepack pnpm@9.15.0 --filter @counterscale/cli exec node scripts/generate-secrets.mjs
```

The generator asks for the dashboard password and prints `CF_PASSWORD_HASH` and `CF_JWT_SECRET`. Keep them in a password manager. Set each value interactively; Wrangler reads it without committing it:

```bash
cd packages/server
corepack pnpm@9.15.0 exec wrangler secret put CF_ACCOUNT_ID
corepack pnpm@9.15.0 exec wrangler secret put CF_BEARER_TOKEN
corepack pnpm@9.15.0 exec wrangler secret put CF_AUTH_ENABLED
corepack pnpm@9.15.0 exec wrangler secret put CF_PASSWORD_HASH
corepack pnpm@9.15.0 exec wrangler secret put CF_JWT_SECRET
corepack pnpm@9.15.0 exec wrangler secret put CF_STORAGE_ENABLED
```

Enter `true` for `CF_AUTH_ENABLED` and `false` for `CF_STORAGE_ENABLED`. Use your Cloudflare account ID, Analytics-read token, generated bcrypt password hash, and generated JWT secret for the other prompts.

## 3. Deploy the Worker

From `packages/server` in the prepared checkout:

```bash
corepack pnpm@9.15.0 exec wrangler deploy --var VERSION:3.4.1-ytpr.1
```

Wrangler should report a URL shaped like `https://ytpr-data.<account>.workers.dev`. Open `/dashboard` and sign in. Confirm `/cache` and `/collect` reject requests without `Origin: https://ytpr.netlify.app`; the application tracker supplies that browser header.

In Cloudflare Billing, verify the account remains on Workers Free and that this Worker has an Analytics Engine binding but no R2 binding or cron trigger.

## 4. Configure Netlify

Add these public build variables, replacing `<account>` with the Workers subdomain Wrangler reported:

```text
VITE_COUNTERSCALE_REPORTER_URL=https://ytpr-data.<account>.workers.dev/collect
VITE_COUNTERSCALE_SITE_ID=ytpr-production
```

Redeploy Netlify. Successful report paths then appear in the authenticated **Playlist Measurements** card. Removing both variables and redeploying disables all application tracking without affecting report generation.
