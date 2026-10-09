# DNSOil

**Domains. DNS. One platform.**

DNSOil is a multi-registrar domain platform with a mobile app and web dashboard. Customers search, purchase, renew, transfer, and manage domains through one account while DNSOil routes operations to supported registrar and DNS-provider integrations.

## Product decisions
- Brand: DNSOil
- Interfaces: mobile app and web dashboard, plus a protected admin console
- Launch currency: USD
- Checkout: prepaid wallet and direct checkout
- DNS: registrar-provided DNS and independent DNS providers
- Customers: individuals, small businesses, agencies, and developers
- Launch: a lean release with a small number of well-integrated providers

## Proposed stack
- TypeScript monorepo with pnpm workspaces
- Web dashboard/admin: Next.js
- Mobile app: Expo / React Native
- Backend API: Fastify
- Primary database: PostgreSQL
- Durable background jobs for provider operations, retries, reminders, and reconciliation

## Start here
- [Architecture](docs/architecture.md)
- [Registrar evaluation](docs/provider-selection.md)
- [Wallet and payments](docs/wallet-and-payments.md)
- [Implementation roadmap](docs/roadmap.md)

## Important launch constraint
Openprovider is the first registrar candidate to evaluate, pending account access, sandbox verification, commercial terms, TLD coverage, and operational testing. Documentation review is not a verified integration. Do not enable live registration or customer deposits until sandbox tests and legal/compliance review are complete.

## Development status
Planning foundation. No live registrar or payment integration has been implemented yet.
