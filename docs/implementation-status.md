# Implementation status

## Workspace foundation

- [x] pnpm workspace structure.
- [x] Fastify API with health and readiness endpoints.
- [x] API domain syntax validation endpoint with normalization and input checks.
- [x] API tests for domain validation and readiness behavior.
- [x] Homepage domain-format checker with explicit syntax-only messaging.
- [x] Public demo dashboard for reviewing the signed-in experience without a real account.
- [x] Vercel Git integration for automatic deployments from `main`.
- [x] Optional PostgreSQL connectivity check when `DATABASE_URL` is configured.
- [x] Transactional, advisory-lock-protected PostgreSQL migration runner.
- [x] Next.js dashboard shell.
- [x] Expo / React Native mobile starter screen.
- [x] Shared domain and API response contracts.
- [x] Initial PostgreSQL schema migration.
- [x] Local PostgreSQL Docker Compose service.
- [x] CI workflow for typecheck, API tests and build.
- [x] Auth.js Google OAuth flow and sign-in page scaffold.
- [x] Protected starter dashboard and sign-out action.
- [ ] Run migrations against a disposable PostgreSQL instance and verify repeatability.
- [ ] Add Google OAuth credentials to Vercel and verify live callback.
- [x] Provision verified Google users into PostgreSQL when internal API configuration is enabled.
- [x] Add short-lived signed API access tokens and a PostgreSQL-backed `GET /v1/me` endpoint.
- [x] Add authenticated read-only `GET /v1/wallet` with ledger-derived balance and recent transaction summary.
- [x] Add wallet holds schema, deferred ledger balance/currency integrity checks, and append-only transaction metadata.
- [ ] Test migrations and ledger triggers against disposable PostgreSQL.
- [ ] Add wallet balance/history UI to the authenticated web and mobile apps.
- [ ] Apply user-scoped authorization to future domain, order, DNS, and wallet endpoints.
- [ ] Extend authentication to mobile.
- [ ] Add live domain availability through a verified registrar sandbox.
- [ ] Add registrar adapter sandbox tests.
- [ ] Select and verify payment provider before checkout.
- [ ] Keep wallet deposits disabled until legal/compliance approval.

The homepage domain checker and API validation check syntax only; they do not query registrar availability, pricing, ownership or registration eligibility. Google user provisioning is implemented but remains inactive unless both server-side internal API settings are configured; short-lived API token issuance and verification are implemented but have not been verified end-to-end against a live OAuth provider and PostgreSQL instance. The wallet endpoint is read-only and returns zero/no-account state when a wallet account has not been created. Deposits and spending are hard-coded off; no payment, top-up, withdrawal or wallet purchase operation is live. Migrations `0002_wallet_ledger_safety.sql` and `0003_wallet_transaction_immutability.sql` add hold records, deferred ledger balancing/currency checks, and immutable transaction metadata. The migrations and triggers have not yet been tested against PostgreSQL. No domain registration, payment or DNS mutation is live. The migration runner is implemented but has not been tested against a live or disposable PostgreSQL instance yet.

See [Google sign-in setup](google-sign-in.md), [API validation/readiness](api-domain-validation.md), and [Vercel preview setup](vercel-preview.md).
