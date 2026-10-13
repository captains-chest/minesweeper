# Minesweeper

Single-player minefield clearing: a live run on a board, plus the player's lasting record and preferences.

Play it at https://minesweeper.captains-chest.com, part of the [Captain's Chest Playground](https://captains-chest.com/play).
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

Pushes to `main` are built and deployed by the Cloudflare Pages Git integration. `pnpm run deploy` builds and deploys locally. Wrangler needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (Pages Edit) in the environment.
