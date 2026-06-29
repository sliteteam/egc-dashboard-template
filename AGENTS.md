# Agent Instructions

You are helping a user recreate an EGC-style LinkedIn/social leaderboard.

## Goal

Create a static dashboard from the user's team content metrics, then deploy the
generated `dist/` folder to a static host such as Cloudflare Pages, Vercel,
Netlify, or GitHub Pages.

## Workflow

1. Read `data.schema.json`.
2. Ask where the user's metrics live: MagicPost, Shield, Taplio, LinkedIn export,
   warehouse, spreadsheet, or pasted data.
3. Create `data.json` matching the schema. Never commit secrets or private tokens.
4. Run `npm run build`.
5. Open or screenshot `dist/index.html` if the user wants visual QA.
6. Deploy `dist/` if requested.

## Data Contract

The dashboard needs team members with the same period keys:

```txt
7d, 30d, 90d, 180d, all
```

Each period should include totals for posts, impressions, likes, comments,
reposts, engagements, engagement rate, average metrics per post, and top posts.

Top posts drive the race animation, monthly trend, and previous-period chips, so
include posted timestamps when possible.

## Hosting

For Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy dist --project-name egc-dashboard
```

Do not recreate Slite's internal `share.helloslite.com` report system. This repo
is intentionally just the public dashboard template plus static hosting docs.
