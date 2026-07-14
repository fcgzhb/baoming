# apps/mp — WeChat Mini Program (uni-app)

uni-app (Vue 3 + Vite) → compiles to WeChat mini-program. Part of the pnpm workspace.

## Run (WeChat)

```bash
pnpm dev:mp-weixin          # outputs to apps/mp/dist/dev/mp-weixin
```

Open **微信开发者工具**, import `apps/mp/dist/dev/mp-weixin`, and set your AppID in
`manifest.json` (`mp-weixin.appid`).

## Build

```bash
pnpm --filter @baoming/mp build:mp-weixin   # -> apps/mp/dist/build/mp-weixin
```

## Config

- `src/utils/request.ts`: `BASE_URL` → backend origin (must be HTTPS + whitelisted as a
  `request` 合法域名 in the mp console; in dev you can disable the domain check in 微信开发者工具).
- `manifest.json`: set `mp-weixin.appid` to your mini-program AppID.
- `@dcloudio` packages are pinned to `3.0.0-alpha-5020120260710001` (the `vue3` dist-tag) —
  a consistent, mutually-compatible set.
