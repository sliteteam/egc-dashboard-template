# Auto Update

This repo can refresh the dashboard on a schedule without copying Slite's
internal `share.helloslite.com` system.

The reusable contract is:

```txt
scripts/fetch-data.mjs prints a complete data.json object to stdout.
```

Everything else is handled by `.github/workflows/refresh-dashboard.yml`: fetch
data, build the static dashboard, validate it, commit the refreshed files, and
optionally deploy `dist/` to Cloudflare Pages.

In this template repo, the workflow stays dormant until `scripts/fetch-data.mjs`
exists. That prevents a fresh fork from running a failing scheduled job before a
real data source is connected.

## 1. Create The Fetch Script

Start from the example:

```bash
cp scripts/fetch-data.example.mjs scripts/fetch-data.mjs
```

Then replace the example logic with your real source:

- MagicPost or Shield API
- Taplio export
- LinkedIn export
- warehouse query
- spreadsheet export

The script should print JSON that matches `data.schema.json`.

```bash
node scripts/fetch-data.mjs > data.json
npm run validate
```

Keep API tokens in environment variables. Do not write tokens, emails, internal
user IDs, private customer data, or raw exports into `data.json`.

The workflow commits `data.json` and `dist/` after validation. Treat both as
public: Cloudflare Pages can serve `dist/data.json`, and GitHub can show
`data.json`.

## 2. Choose A Deploy Pattern

### Cloudflare Pages Git Integration

This is the simplest path.

1. Create a Cloudflare Pages project.
2. Connect it to this GitHub repo.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.

The scheduled GitHub Action commits refreshed `data.json` and `dist/`; Cloudflare
Pages deploys the new commit automatically.

### Direct Cloudflare Deploy From GitHub Actions

Use this when you do not want Cloudflare Pages connected to the repo.

Add these GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Optionally add this repository variable:

- `CLOUDFLARE_PAGES_PROJECT` defaults to `egc-dashboard`

The workflow will run:

```bash
npx wrangler pages deploy dist --project-name "$CLOUDFLARE_PAGES_PROJECT"
```

The token should only have permission to deploy the target Pages project.

## 3. Enable The Schedule

The included workflow runs daily at 07:00 UTC:

```yaml
schedule:
  - cron: "0 7 * * *"
```

Edit `.github/workflows/refresh-dashboard.yml` if you want a different rhythm.
You can also run it manually from GitHub Actions with **Run workflow**.

## Agent Prompt

Use this when asking an agent to wire the update loop:

```txt
Wire automatic refresh for this EGC dashboard.
Read docs/auto-update.md and data.schema.json.
Create scripts/fetch-data.mjs for our data source.
Use environment variables or GitHub Actions secrets for tokens.
Run npm run validate.
Keep the output public-safe, then enable the refresh-dashboard GitHub Action.
```
