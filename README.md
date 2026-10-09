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

## Repository layout

- `apps/web` — Next.js dashboard starter
- `apps/mobile` — Expo / React Native starter
- `apps/api` — Fastify API service
- `packages/shared` — shared domain and API types
- `db/migrations` — PostgreSQL schema migrations
- `docs/` — architecture, provider evaluation, payments and roadmap

## Local development

Requirements: Node.js 24+, pnpm 10+, and Docker (for local PostgreSQL).

```sh
pnpm install
docker compose up -d postgres
pnpm dev:api
```

The API listens on port `4000` by default. Check `GET /health` for the service health response. The web app can be started with `pnpm dev:web`; the mobile app with `pnpm dev:mobile`.

## Current status

The initial workspace and UI scaffolds are being built on the `feat/initial-workspace` branch. Domain search is currently a UI placeholder. Authentication, database connectivity, registrar operations, checkout and wallet operations are not implemented or live yet.

Openprovider remains the first registrar candidate to evaluate, pending account access, sandbox verification, commercial terms, TLD coverage, and operational testing. Customer wallet deposits must remain disabled until legal/compliance review and payment-provider approval are complete.

See [implementation status](docs/implementation-status.md) and the [architecture](docs/architecture.md).
