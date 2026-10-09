# Hosting integration architecture

## Product boundary

Hosting is a separate provider integration from domain registration. A domain can be registered at one company and hosted at another; DNSOil must not infer cPanel credentials, service status, or hosting details from the registrar record.

The first implementation is a provider-neutral data/API foundation. It does **not** provision hosting, connect to a live cPanel/Plesk vendor, change hosting plans, or claim any service is live.

## Data flow

1. A verified hosting-provider adapter authenticates with the provider API and fetches hosting services.
2. The adapter maps provider responses to the normalized `HostingServiceSnapshot` in `apps/api/src/hosting-providers.ts`.
3. A trusted server-side worker calls `POST /v1/internal/hosting/services/sync` using `x-dnsoil-internal-secret`. The endpoint requires an active DNSOil user, validates service metadata, and upserts provider data in a transaction.
4. The signed-in dashboard calls `GET /v1/hosting/services`; it returns only services owned by that account. Provider snapshots include their last-sync timestamp.
5. The provider remains authoritative. DNSOil should display stale-data timestamps and sync errors instead of implying a cached snapshot is live.

## Database and endpoints

Migration `0006_hosting_provider_foundation.sql` adds `hosting_provider_connections`, independent from registrar `provider_connections`, and `hosting_services`, keyed by provider connection + provider service ID. It stores owner, product, domain, plan, status, renewal date, stable control-panel URL, and last-sync timestamp. HTTPS-only control-panel URL validation rejects query strings and fragments to avoid persisting tokenized or one-time SSO links.

- `GET /v1/hosting/services` — authenticated, account-scoped, read-only list.
- `POST /v1/internal/hosting/services/sync` — trusted adapter-worker upsert; requires `DNSOIL_INTERNAL_API_SECRET` in the API environment and `x-dnsoil-internal-secret` header.

The sync endpoint refuses to reassign an existing provider service ID to another DNSOil user. Keep the internal secret server-side only.

## cPanel, Plesk and access security

- Do not collect or store customers' raw cPanel/Plesk passwords.
- First choice: provider API plus one-click, short-lived SSO URL generated at click time and never persisted.
- Until SSO exists, show a provider's stable HTTPS control-panel landing page as an external link; it may still require the user to sign in with the provider.
- Do not assume every host exposes a supported API or SSO feature. Record capabilities per adapter and gracefully fall back to provider portal links.
- Encrypt provider API credentials at rest in a dedicated secret store. Never send provider credentials to browser or mobile clients.
- Keep provider webhooks authenticated, idempotent and replay-protected. Reconcile periodic snapshots with webhooks.


## Provider adapter selection

The next decision is the first hosting partner and its actual control plane. “cPanel hosting” alone is not enough to identify the right integration:

- If the hosting company manages customer accounts and billing through **WHMCS**, evaluate its [official API](https://developers.whmcs.com/api/) first for customer-owned services, product names, status, and renewal metadata. Each WHMCS installation is controlled by that hosting provider; DNSOil still needs an authorized API account and a clear customer-to-provider account mapping.
- If DNSOil has an authorized reseller/administrator relationship with a cPanel host, the [WHM API](https://api.docs.cpanel.net/whm/introduction) can manage reseller/account operations. cPanel documents [temporary Single Sign On sessions](https://api.docs.cpanel.net/guides/guide-to-api-authentication/guide-to-api-authentication-single-sign-on), which are a better target than storing account passwords.
- For a Plesk-based host, evaluate the [Plesk REST API](https://docs.plesk.com/en-US/obsidian/api-rpc/about-rest-api.79359/). Access depends on administrator-level authorization and the REST API's supported feature set.

These are candidate integration paths, not connected providers. The selected provider must confirm API access, scope, service ownership mapping, rate limits, sandbox/test facilities, and commercial permission before live sync is enabled.

## Rollout sequence

1. **Foundation (current):** schema, normalized adapter contract, account-scoped API, trusted sync endpoint, dashboard/demo presentation.
2. **First partner:** choose one host/reseller with documented API access, sandbox or test account, clear commercial terms, and support for service listing/status/renewal data.
3. **Read-only sync:** implement and test the provider adapter and periodic sync; measure staleness and error handling.
4. **Control-panel access:** stable external portal first, then short-lived SSO if the provider officially supports it.
5. **Provisioning/billing:** only after provider and commercial decisions; add idempotent orders, explicit user confirmation, audit logs and refund/reconciliation paths. Do not conflate registrar renewals with hosting renewals.

No specific hosting provider is selected or connected yet.
