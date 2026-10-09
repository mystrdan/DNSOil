# Implementation status

## Workspace foundation

- [x] pnpm workspace structure.
- [x] Fastify API with health and readiness endpoints.
- [x] API domain syntax validation endpoint with normalization and input checks.
- [x] API tests for domain validation and readiness behavior.
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
- [ ] Add Google OAuth credentials to local/deployment environment and verify live callback.
- [ ] Provision authenticated users into PostgreSQL and connect session identity to API authorization.
- [ ] Extend authentication to mobile.
- [ ] Add live domain availability through a verified registrar sandbox.
- [ ] Add registrar adapter sandbox tests.
- [ ] Select and verify payment provider before checkout.
- [ ] Keep wallet deposits disabled until legal/compliance approval.

Domain validation checks syntax only; it does not query registrar availability, pricing, ownership or registration eligibility. No domain registration, payment, wallet deposit or DNS mutation is live. The migration runner is implemented but has not been tested against a live or disposable PostgreSQL instance yet.

See [Google sign-in setup](google-sign-in.md) and [API validation/readiness](api-domain-validation.md).
