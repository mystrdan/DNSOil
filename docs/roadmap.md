# DNSOil Implementation Roadmap

A step is complete only when its acceptance checks pass. Do not build live payment or registrar operations on unverified assumptions.

## Phase 0 — Foundation and decisions
- [x] Confirm name DNSOil.
- [x] Record mobile app and web dashboard.
- [x] Record USD, prepaid wallet plus direct checkout.
- [x] Record registrar DNS plus independent DNS providers.
- [x] Record lean multi-registrar launch.
- [x] Document architecture, provider evaluation, wallet safety and roadmap.
- [ ] Confirm legal structure and wallet compliance path.
- [ ] Obtain sandbox account and credentials for first registrar candidate.
- [ ] Select payment provider after currency, settlement and wallet eligibility checks.
- [ ] Confirm launch TLD shortlist and registration requirements.

## Phase 1 — Repository and application foundation
- [ ] Create pnpm workspace with apps/web, apps/mobile, apps/api, apps/worker and packages/shared.
- [ ] Add formatting, linting, type checks, tests and CI.
- [ ] Validate configuration and fail safely when required secrets are missing.
- [ ] Add PostgreSQL schema and versioned migrations.
- [ ] Add health/readiness endpoints, structured redacted logs and request IDs.
- [ ] Add authentication, sessions, organizations and role-based access.
- [ ] Add development and sandbox/staging configuration.

Acceptance: a clean checkout can install, type-check, test, migrate a clean database and run each app locally with documented steps.

## Phase 2 — First registrar adapter
- [ ] Implement typed provider interface and capability registry.
- [ ] Implement Openprovider sandbox adapter after credentials are obtained.
- [ ] Add availability/price quotes, TLD requirement validation and quote expiry.
- [ ] Add order/provider-operation state machines and idempotency.
- [ ] Add domain portfolio mapping and reconciliation worker.
- [ ] Add adapter contract and sandbox end-to-end tests.
- [ ] Document timeout, retry, ambiguous-result and provider-outage behavior.

Acceptance: sandbox registration can be initiated, retrieved and reconciled without duplicate orders; unsupported capabilities are explicit.

## Phase 3 — DNS and domain management
- [ ] Display domains and expiry/status consistently on web and mobile.
- [ ] Add renewals, transfer status, nameserver changes and contact changes where supported.
- [ ] Add DNS-provider connection model and capability checks.
- [ ] Implement DNS management for one verified provider.
- [ ] Export/backup records before destructive DNS operations.
- [ ] Add expiry and transfer notifications.

Acceptance: customers can see which provider manages each operation; nameserver changes are not misrepresented as DNS migration.

## Phase 4 — Checkout and money movement
- [ ] Confirm compliance model before enabling stored-value wallet.
- [ ] Implement append-only double-entry ledger and reconciliation.
- [ ] Implement payment adapter, signed webhooks and duplicate-event protection.
- [ ] Implement direct checkout and verified refunds.
- [ ] Implement wallet top-ups and holds only after approval.
- [ ] Add receipts, order history, fees and customer-facing failure states.
- [ ] Test price changes, payment success with registrar failure, registrar success with delayed response, duplicate webhooks and refunds.

Acceptance: webhook retries cannot duplicate credits/debits; every balance movement is auditable; ambiguous registration is reconciled before retry; charges and provider costs reconcile.

## Phase 5 — Web and mobile experience
- [ ] Domain search and results with clear registration and renewal pricing.
- [ ] Checkout with wallet and direct payment options when enabled.
- [ ] Unified portfolio and domain details.
- [ ] DNS records and nameserver controls.
- [ ] Wallet balance/history if wallet is enabled.
- [ ] Account security, notifications and support.
- [ ] Protected admin operations and reconciliation queue.

Acceptance: core journeys work on web and mobile with accessible loading, empty, error, pending and success states.

## Phase 6 — Second provider and launch hardening
- [ ] Integrate a second registrar after the first adapter passes lifecycle tests.
- [ ] Verify provider routing and exit strategy.
- [ ] Load, security and backup-restore tests.
- [ ] Privacy, terms, acceptable-use, renewal and refund policies.
- [ ] Incident response, support escalation and provider-outage playbooks.
- [ ] Production credentials, least-privilege access, monitoring and alerting.
- [ ] Limited beta before broad launch.

## MVP launch gates
- One registrar passes sandbox lifecycle tests and production terms are approved.
- Payment and wallet model is approved; otherwise keep wallet disabled and evaluate direct checkout separately.
- TLD availability, pricing, requirements, renewal costs and refund behavior are clear.
- No secrets are committed; sensitive credentials are encrypted and access-audited.
- Orders, wallet entries, payments and registrar costs reconcile.
- Ambiguous provider outcomes cannot trigger blind duplicate registration or charging.
- Support can trace each order through internal and provider references.
- Backup restore and security review pass.
