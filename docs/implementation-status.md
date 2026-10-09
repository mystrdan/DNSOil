# Implementation status

## Workspace foundation (in progress)

- [x] Dedicated feature branch.
- [x] pnpm workspace structure.
- [x] Fastify API with health and readiness endpoints.
- [x] Next.js dashboard shell.
- [x] Expo / React Native mobile starter screen.
- [x] Shared domain and API response contracts.
- [x] Initial PostgreSQL schema migration.
- [x] Local PostgreSQL Docker Compose service.
- [x] CI workflow for typecheck and build.
- [x] Auth.js Google OAuth flow and sign-in page scaffold.
- [x] Protected starter dashboard and sign-out action.
- [ ] Add Google OAuth credentials to local/deployment environment and verify live callback.
- [ ] Provision authenticated users into PostgreSQL and connect session identity to API authorization.
- [ ] Extend authentication to mobile.
- [ ] Generate and commit pnpm lockfile after running installs in a build environment.
- [ ] Database connection, migration runner and integration tests.
- [ ] Registrar adapter interface and sandbox tests.
- [ ] Select and verify payment provider before checkout.
- [ ] Keep wallet deposits disabled until legal/compliance approval.

Google sign-in requires OAuth credentials in `apps/web/.env.local` or deployment environment. Domain search remains a UI placeholder. No domain registration, payment, wallet deposit or DNS mutation is live in this scaffold.

See [Google sign-in setup](google-sign-in.md).
