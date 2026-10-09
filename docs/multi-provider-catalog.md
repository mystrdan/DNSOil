# Multi-provider catalogue and pricing

## Product direction

DNSOil should let customers compare providers rather than force every customer into one registrar or host. Registrar and hosting choices are separate: the registrar owns domain registration/renewal, while the hosting company owns the hosting plan, control panel, hosting renewal and support.

The first increment implements the provider-neutral price catalogue and the fee calculation. It does **not** connect a real registrar, check real-time domain availability, reserve a service, take payment or place orders.

## Price data and freshness

Migration `0007_provider_catalog.sql` creates:

- `provider_catalog_providers`: provider key, service category, environment, status, adapter capabilities and last-sync time.
- `provider_catalog_offers`: service type, product, TLD where applicable, term, currency, provider price in integer minor units, availability flag, sync timestamp and expiry time.

Only providers with `status = 'active'`, `environment = 'production'` and offers with `is_available = true` and a future `valid_until` are shown to customers. An empty result is a valid response and must never be filled with invented prices. Sandboxes, stale offers, disabled providers and unavailable offers stay out of the public catalogue.

## API

- `GET /v1/catalog/offers?serviceType=domain-registration&tld=com&currency=USD` — returns current synchronized offers and price breakdowns.
- `GET /v1/catalog/offers?serviceType=hosting&currency=USD` — returns current synchronized hosting packages.
- `POST /v1/internal/catalog/offers/sync` — trusted provider adapter worker upserts one offer. It requires the server-only `x-dnsoil-internal-secret` header.

The internal sync payload contains `providerKey`, `providerName`, `serviceCategory` (`registrar` or `hosting`), `providerStatus`, `environment`, `serviceType`, `productKey`, `productName`, optional `domainTld`, `termMonths`, `currency`, `basePriceMinor`, `available`, a future `validUntil`, and optional non-secret `capabilities` / `metadata`.

Provider adapters must use official, authorized APIs and map their responses into this normalized format. Do not put credentials, account passwords, API tokens or one-time login links in `metadata`.

## Proposed DNSOil fee

The initial product proposal is a **1% DNSOil service fee** on the provider's price, shown as a separate line item:

```text
provider price = 1,999 cents ($19.99)
DNSOil fee = ceil(provider price × 1%) = 20 cents ($0.20)
pre-tax total = 2,019 cents ($20.19)
```

The API calculates with integer minor units and rounds the fee upward to the next minor unit so the fee is not silently rounded down to zero on low-price offers. It returns `providerPriceMinor`, `dnsoilFeeBps`, `dnsoilFeeMinor` and `totalPriceMinor`. It currently supports USD only. Tax, payment processing, FX, refunds and provider-specific surcharges are not included in this calculation.

The 1% is a proposed default, not a promise that every provider will permit this model. Before enabling purchases, confirm provider contracts allow resale/markup, decide whether the fee applies to renewals/transfers/hosting and premium domains, define tax and refund handling, and disclose the fee before the user confirms. Keep provider price and DNSOil fee independently auditable.

## Customer experience

`/demo/providers` is an interactive prototype with fictional providers and prices. It lets a reviewer toggle domain registration versus hosting, sort by price/provider, select an offer and inspect the fee breakdown. All sample values are explicitly labelled fictional. This route is a UX demo, not a live store.

## Checkout requirements before launch

1. Re-check live availability and price with the selected provider immediately before creating an order.
2. Show the exact provider, service, registration term, renewal price/term, taxes, DNSOil fee, total and cancellation/refund policy before confirmation.
3. Create an idempotent order tied to the selected provider and a quote snapshot; expire quotes quickly.
4. Use a payment-provider integration or enabled wallet only after compliance review. Do not treat the wallet's current disabled state as permission to accept funds.
5. Reconcile payment and provider order status, including timeouts, duplicate callbacks, partial failures, refunds and failed registrations.
6. If a provider is unavailable or changes its price, do not silently switch the customer's chosen provider or charge a different amount. Ask the customer to confirm the new quote.
7. Show renewal pricing distinctly from first-year promotional pricing, and never compare offers without matching terms, currency and included features.

## Current limitations

No real provider adapters, live domain availability, checkout, payment, taxes, order fulfillment or hosting provisioning are connected yet. An active catalogue offer can only come from a future authorized adapter. The catalogue is infrastructure for comparison, not a claim that DNSOil already has live provider access.
