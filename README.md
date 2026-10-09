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

- `apps/web` — Next.js dashboard, Google sign-in and starter account page
- `apps/mobile` — Expo / React Native starter
- `apps/api` — Fastify API, domain syntax validation and database readiness checks
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

The API listens on port `4000` by default. Check `GET /health` for process health and `GET /ready` for database readiness. Configure `DATABASE_URL` to enable the PostgreSQL connectivity check. Validate a domain name with `POST /v1/domains/validate`; this checks syntax only and does not query registrar availability. See [API validation and readiness](docs/api-domain-validation.md).

For the web app, copy `apps/web/.env.example` to `apps/web/.env.local`, set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`, then open `/auth/signin`. See [Google sign-in setup](docs/google-sign-in.md). Start web with `pnpm dev:web`; start mobile with `pnpm dev:mobile`.

## Current status

The workspace foundation and Google sign-in scaffold have been merged into `main`. Google OAuth still requires real client credentials and has not been live-tested. Domain syntax validation and optional PostgreSQL readiness checks are implemented in the API. Domain availability/search, persistent user provisioning, registrar operations, checkout and wallet operations are not live yet.

Openprovider remains the first registrar candidate to evaluate, pending account access, sandbox verification, commercial terms, TLD coverage, and operational testing. Customer wallet deposits must remain disabled until legal/compliance review and payment-provider approval are complete.

See [implementation status](docs/implementation-status.md) and the [architecture](docs/architecture.md).
