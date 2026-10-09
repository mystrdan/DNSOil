# DNSOil Architecture

## Goals
1. Give customers one consistent domain-management experience across mobile and web.
2. Support multiple registrars and DNS providers without coupling product logic to one vendor.
3. Treat money movement and domain-registration operations as auditable state machines.
4. Start lean with a modular backend, one production database, and durable background work; avoid premature microservices.

## Proposed stack
- Monorepo: pnpm workspaces + TypeScript
- Web dashboard/admin: Next.js
- Mobile: Expo + React Native
- API: Fastify with schema-validated HTTP contracts
- Database: PostgreSQL with versioned migrations
- Background jobs: begin with a PostgreSQL-backed durable queue; add dedicated queue infrastructure only when justified
- Testing: unit tests, adapter contract tests, API integration tests, sandbox end-to-end tests

Keep web, mobile, and backend independently deployable, but share types and validation schemas where useful. The admin console requires explicit staff authorization and strong audit controls.

## Logical flow
Customer app / web dashboard / admin console -> DNSOil API -> application services -> PostgreSQL + durable jobs -> registrar adapters / DNS adapters / payment adapters.

## Core modules
- Identity and access: users, sessions, MFA support, organizations, memberships, roles
- Domain search and pricing: availability, quotes, TLD requirements, quote expiry
- Orders: idempotent checkout, explicit states, provider operation references
- Portfolio: unified domain records mapped to provider and provider-domain identifiers
- Registrar adapter: check, quote, register, renew, transfer, retrieve status, update nameservers and contacts where supported
- DNS adapter: zones and records, provider capability checks, operation status
- Wallet: append-only double-entry ledger, balance projections, holds, releases, refunds
- Payments: payment intents, signed webhook verification, idempotency and reconciliation
- Notifications: receipts, expiry reminders, transfer updates, security events
- Operations/admin: provider health, failed jobs, reconciliation exceptions, audit history

## Provider adapter contract
Each adapter advertises capabilities explicitly. Never assume every provider supports every TLD or operation.

Registrar capabilities to model: availability and pricing; register, renew, transfer-in and transfer status; list/retrieve domains; nameserver updates; TLD-specific registration requirements; provider balance and invoice references where available.

DNS capabilities are separate: list supported operations; create/read/update/delete records; create/read zones where supported; export records before destructive changes; expose DNSSEC capabilities where supported.

Normalize provider results into DNSOil types while retaining provider IDs, raw status codes, timestamps, and redacted diagnostics. Never log credentials, authentication tokens, payment secrets, or unnecessary personal data.

## Data ownership
The registrar remains authoritative for registration and registry lifecycle. DNSOil stores customer and organization ownership, provider mappings, order/payment state, last-known provider state and sync timestamps, preferences, notification history, DNS-provider mappings, and audit/support diagnostics.

The DNS provider is authoritative for its own zones and records. Nameserver configuration and DNS-zone contents are distinct concepts. Changing nameservers is not equivalent to migrating a DNS zone.

## Reliability rules
- Use explicit order and provider-operation state machines.
- Create an internal operation ID before sending an external write.
- Use provider idempotency keys where available; otherwise reconcile ambiguous outcomes before retrying.
- Never blindly retry a registration after timeout: query provider state and resolve the prior operation first.
- Use signed, idempotent webhooks and periodic reconciliation.
- Persist provider diagnostics only after redaction and data minimization.
- Apply timeouts, bounded retries with backoff, rate limits, and circuit breakers where warranted.

## Initial data model
Expected core tables: users, sessions, organizations, organization_members, provider_accounts, provider_capabilities, domains, domain_provider_links, domain_contacts, domain_quotes, orders, order_items, provider_operations, dns_connections, dns_zones, optional dns_records_cache, wallets, ledger_accounts, ledger_transactions, ledger_entries, wallet_holds, payment_intents, payment_events, refunds, notifications, audit_events, reconciliation_runs, reconciliation_exceptions, idempotency_keys.

Use UUID/ULID internal IDs, foreign keys, unique constraints, and database transactions. Monetary amounts are integer minor units (USD cents) with an explicit currency code; never use floating-point for money.

## Security baseline
- Secrets stay server-side and out of client bundles and Git.
- Encrypt sensitive provider credentials at rest with managed keys where available.
- Use least-privilege provider credentials and separate sandbox/production credentials.
- Enforce MFA for staff and support roles and strong customer session controls.
- Use role-based access control for agencies and organizations.
- Audit wallet adjustments, privileged actions, credential changes, and ownership-sensitive actions.
- Verify payment webhook signatures before processing.
- Apply rate limits, origin/CSRF protections as appropriate, and sensitive-action controls.
- Define retention, export, deletion, incident response, and backup/restore procedures.

## MVP deployment shape
Begin with one API service, one worker process, PostgreSQL, and web, mobile, and admin clients. Split services only when there is a demonstrated need. Maintain separate development, sandbox/staging, and production environments.
