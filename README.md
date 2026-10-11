# Minesweeper

Single-player minefield clearing: a live run on a board, plus the player's lasting record and preferences.

Play it at https://minesweeper.play.captains-chest.com, part of the [Captain's Chest Playground](https://play.captains-chest.com).
Built with Angular, pnpm and TypeScript; the domain language is in [CONTEXT.md](CONTEXT.md).

## Develop

```bash
pnpm install
pnpm start     # http://localhost:4200
pnpm test      # Vitest
```

## Build and deploy

The site is static files in `dist/minesweeper/browser`, hosted on the Cloudflare Pages project `minesweeper`.

```bash
pnpm build
pnpm exec wrangler pages deploy dist/minesweeper/browser --project-name minesweeper --branch main
```

Pushes to `main` deploy automatically via `.github/workflows/deploy.yml` (tests and build first; also runnable by hand with workflow_dispatch). `pnpm run deploy` runs both steps locally. Wrangler needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (Pages Edit) in the environment.
