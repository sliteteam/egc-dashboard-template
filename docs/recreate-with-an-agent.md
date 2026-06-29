# Recreate With An Agent

Copy this prompt into your coding agent:

```txt
I want to recreate this EGC dashboard for my team.

Use this repository as the template. Read AGENTS.md and data.schema.json.
Ask me where my team metrics live. Create data.json matching the schema, run
npm run build, then deploy dist/ to Cloudflare Pages.

Keep the dashboard static. Do not build an auth system. Do not commit API tokens.
```

If you want it to refresh automatically, add:

```txt
Also read docs/auto-update.md.
Create scripts/fetch-data.mjs for our source system and wire the
refresh-dashboard GitHub Action.
```

Good sources:

- MagicPost org analytics
- Shield Analytics
- Taplio
- LinkedIn exports
- A spreadsheet with one row per person and period
- A warehouse query that aggregates social metrics

The only required output from the data step is `data.json`.
