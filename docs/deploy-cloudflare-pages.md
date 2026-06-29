# Deploy To Cloudflare Pages

The dashboard builds to a static `dist/` folder. You do not need a server.

## One-Off Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name egc-dashboard
```

Wrangler will print a Pages URL when the deploy finishes.

## GitHub-Connected Deploy

1. Create a Cloudflare Pages project.
2. Connect this GitHub repo.
3. Set the build command to:

```txt
npm run build
```

4. Set the output directory to:

```txt
dist
```

5. Add whatever process generates `data.json` before `npm run build`.

## Keeping It Fresh

If your data source has an API, use the included scheduled GitHub Action:

```bash
cp scripts/fetch-data.example.mjs scripts/fetch-data.mjs
# edit scripts/fetch-data.mjs for your source
```

Then read [docs/auto-update.md](auto-update.md). Keep API tokens in GitHub
Actions secrets or Cloudflare environment variables. Never commit them.
