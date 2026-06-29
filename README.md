# EGC Dashboard Template

A static, agent-friendly template for building an Employee Generated Content
leaderboard: team reach, top posts, race animation, trends, and per-poster
benchmarks.

This is the public version of the Slite EGC dashboard. It does not include
Slite's internal report host, Cloudflare Access, upload flows, or private
MagicPost credentials. It is just the reusable dashboard engine.

## Quick Start

```bash
npm install
npm run build
open dist/index.html
```

By default the build uses `data.example.json`. To use your own data:

```bash
cp data.example.json data.json
# edit data.json or ask an agent to generate it from your source system
npm run build
```

The dashboard is static. You can host `dist/` anywhere.

## Recreate With An Agent

Point your agent at this repository and say:

```txt
Build an EGC dashboard for our team.
Use AGENTS.md, inspect data.schema.json, create data.json from our LinkedIn or
social analytics export, run npm run build, and deploy dist/ to Cloudflare Pages.
```

The agent should only need to produce a `data.json` matching the schema. The
visual system and build step are already here.

## Data Sources

The included dashboard expects aggregated metrics by person and period:

- posts
- impressions / reach
- likes, comments, reposts
- top posts with public URLs and timestamps
- follower counts

You can feed it from MagicPost, Shield, Taplio, a spreadsheet export, a warehouse
query, or a hand-built JSON file. The source does not matter as long as
`data.json` matches `data.schema.json`.

## Deploy To Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name egc-dashboard
```

More detail: [docs/deploy-cloudflare-pages.md](docs/deploy-cloudflare-pages.md).

## Files

- `AGENTS.md` tells coding agents how to recreate the dashboard.
- `data.schema.json` is the public data contract.
- `data.example.json` is fake sample data.
- `src/template.html` is the visual dashboard.
- `scripts/build.mjs` embeds data into the template and writes `dist/`.
- `public/photos/` contains sample avatars copied into `dist/photos/`.

## Privacy

Do not commit tokens, private post analytics, private customer data, or raw
employee exports you do not want public. For a public demo, use anonymized data
or data from posts that are already public.

## Built By Slite

Built by [Slite](https://slite.com) as a forkable template for teams that want
to turn social posting into a visible, playful team ritual.
