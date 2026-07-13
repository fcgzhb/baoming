# apps/mp — WeChat Mini Program (uni-app)

uni-app (Vue 3, vite) → compiles to WeChat mini-program.

## Bootstrap

`@dcloudio` packages use **timestamped versions** (e.g. `3.0.0-4030620241128001`) that drift
frequently. To guarantee a working install, bootstrap with the official template, then keep the
`src/`, `pages.json`, `manifest.json` provided here:

```bash
cd apps/mp
npx degit dcloudio/uni-preset-vite#vite-ts .   # merge over existing files (keep src/)
pnpm install
```

> This is why `apps/mp` is **excluded from the root `pnpm-workspace.yaml`** by default — so the
> server/admin install isn't blocked by an @dcloudio version mismatch. After bootstrap, add
> `apps/mp` back to `pnpm-workspace.yaml` and `pnpm install` again.

## Run (WeChat)

```bash
pnpm dev:mp-weixin          # outputs to apps/mp/dist/dev/mp-weixin
```

Open **微信开发者工具**, import `apps/mp/dist/dev/mp-weixin`, and set your AppID in
`manifest.json` (`mp-weixin.appid`).

## Config

- `src/utils/request.ts`: `BASE_URL` → backend origin (must be HTTPS + whitelisted as a request
  合法域名 in the mp console; in dev you can disable domain check in 微信开发者工具).
