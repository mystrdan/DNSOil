# Implementation status

## Workspace foundation (in progress)

- [x] Dedicated feature branch.
- [x] pnpm workspace structure.
- [x] Fastify API with health and readiness endpoints.
- [x] Next.js dashboard shell.
- [x] Expo / React Native mobile starter screen.
- [x] Shared domain and API response contracts.
- [x] Initial PostgreSQL schema migration.
- [ ] Database connection, migration runner and integration tests.
- [ ] Linting, formatting, CI and dependency lockfile.
- [ ] Authentication and authorization.
- [ ] Registrar adapter interface and sandbox tests.
- [ ] Select and verify payment provider before checkout.
- [ ] Keep wallet deposits disabled until legal/compliance approval.

The UI currently communicates that domain search is not connected. No domain registration, payment, wallet deposit or DNS mutation is live in this scaffold.
