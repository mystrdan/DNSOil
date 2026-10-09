# DNSOil

**Domains. DNS. One platform.**

DNSOil is a multi-registrar domain platform with a mobile app and web dashboard. Customers will be able to search, purchase, renew, transfer, and manage domains through one account while DNSOil routes operations to supported registrar and DNS-provider integrations.

## Stack

- **Language:** TypeScript
- **Web dashboard/admin:** Next.js and React
- **Mobile:** Expo and React Native
- **Backend API:** Fastify
- **Database:** PostgreSQL
- **Workspace:** pnpm monorepo
- **Web authentication:** Auth.js with Google OAuth

## Repository layout

- `apps/web` — Next.js public homepage, Google sign-in, account dashboard with wallet status panel, and public dashboard demo
- `apps/mobile` — Expo / React Native starter
- `apps/api` — Fastify API, domain syntax validation, database readiness, protected user provisioning, short-lived bearer-token verification, and read-only wallet summary
- `packages/shared` — shared domain and API types
- `db/migrations` — PostgreSQL schema migrations
- `docs/` — architecture, provider evaluation, payments and implementation notes

## Local development

Requirements: Node.js 24+, pnpm 10+, Docker (for local PostgreSQL), and Google OAuth credentials for the web sign-in flow.

```sh
pnpm install
docker compose up -d postgres
pnpm dev:api
```

The API listens on port `4000` by default. Check `GET /health` for process health and `GET /ready` for database readiness. Configure `DATABASE_URL` to enable PostgreSQL checks. The homepage domain form checks syntax only; in Vercel previews it can run without a separate API deployment, and in configured environments it proxies to the API. It does not query registrar availability. See [API validation and readiness](docs/api-domain-validation.md) and [Vercel preview setup](docs/vercel-preview.md).

For the web app, copy `apps/web/.env.example` to `apps/web/.env.local`, set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`, then open `/auth/signin`. To enable persistent Google-user provisioning, configure `DNSOIL_API_URL` and the same high-entropy `DNSOIL_INTERNAL_API_SECRET` in both web and API environments, and apply the database migration first. To enable short-lived API bearer tokens, configure a separate `DNSOIL_API_TOKEN_SECRET` in both environments. See [Google sign-in setup](docs/google-sign-in.md) and [user provisioning](docs/user-provisioning.md). Start web with `pnpm dev:web`; start mobile with `pnpm dev:mobile`.

## Live previews

- **Public homepage:** [DNSOil on Vercel](https://dnsoil-web.vercel.app/)
- **Signed-in experience demo:** [Preview the dashboard](https://dnsoil-web.vercel.app/demo/dashboard)
- **Sign-in screen:** [Google sign-in UI](https://dnsoil-web.vercel.app/auth/signin)

The demo dashboard is a public, clearly labelled mockup using fictional `.example` domains. It does not require signing in and does not change real accounts or domains. Vercel deployment protection may require an approved preview/share link for direct access. Real Google sign-in is not ready until OAuth credentials and the required server environment variables are configured.

## Current status

The workspace foundation and Google sign-in scaffold have been merged into `main`. Google OAuth still requires real client credentials and has not been live-tested. Domain syntax validation and optional PostgreSQL readiness checks are implemented in the API. Persistent Google-user provisioning and short-lived user-scoped API tokens are implemented behind explicit server-side configuration but have not been tested end-to-end. The authenticated `GET /v1/wallet` endpoint returns the signed-in user's wallet status, ledger-derived balance and recent transactions when PostgreSQL is configured. The signed-in dashboard and public demo both show the wallet as not enabled, with funding unavailable. Wallet funding and spending are deliberately disabled; no top-up, withdrawal, payment or purchase endpoint is live. Migration `0002_wallet_ledger_safety.sql` adds wallet holds and deferred ledger balance/currency checks, but migrations still need validation against PostgreSQL. Domain availability/search, registrar operations and checkout are not live yet.

Openprovider remains the first registrar candidate to evaluate, pending account access, sandbox verification, commercial terms, TLD coverage, and operational testing. Customer wallet deposits must remain disabled until legal/compliance review and payment-provider approval are complete.

See [implementation status](docs/implementation-status.md) and the [architecture](docs/architecture.md).
