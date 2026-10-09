# DNSOil Wallet and Payments

## Product model
- Launch currency: USD.
- Checkout: prepaid wallet and direct checkout.
- DNSOil's customer wallet is separate from any balance DNSOil holds with a registrar.
- Withdrawals are out of MVP scope unless legal, fraud and payment requirements dictate otherwise.
- Auto-renew is opt-in and clearly discloses the funding source and renewal-price behavior.

## Important launch gate
A customer-facing stored-value balance can trigger payment, safeguarding, consumer-protection, tax, AML/KYC or money-transmission obligations depending on DNSOil's legal structure, customer geography, payment flow and where funds are held. Obtain qualified legal/compliance review and confirm the payment provider permits this model before accepting live deposits. If not approved, launch direct checkout first and defer prepaid balances.

Do not describe a wallet as a bank account or promise withdrawals unless actually supported and legally approved.

## Ledger design
Use an append-only, double-entry ledger. Ledger entries are the financial source of truth; a cached wallet balance is only a projection.
- Amounts use integer USD cents and an explicit currency.
- Every transaction balances debits and credits.
- Posted entries are immutable. Corrections use compensating entries.
- Write a transaction and all its entries atomically.
- Unique external event IDs and internal idempotency keys prevent duplicate credits/debits.
- Holds reserve funds for an in-progress order; capture on confirmed completion or release on failure.
- Track customer funds, payment-provider clearing, registrar cost/payable, platform revenue, fees and refunds as distinct accounts.
- Reconcile internal records against payment events and registrar charges/balance reports.

## Current implementation status

- `GET /v1/wallet` is an authenticated, read-only API endpoint. It requires the five-minute bearer token used by `GET /v1/me` and a configured PostgreSQL connection.
- The endpoint returns the USD account status, a balance calculated from ledger entries, and up to 20 recent ledger transactions. If no USD wallet account exists, it returns a zero balance and `not-created` status without creating an account.
- Deposits and spending are explicitly reported as disabled. There are no live top-up, withdrawal, capture, refund, or wallet-funded domain-purchase endpoints.
- Migrations `0002_wallet_ledger_safety.sql` and `0003_wallet_transaction_immutability.sql` add wallet holds, deferred checks that ledger entries balance and use the wallet account currency, and immutable ledger transaction metadata. Posted entries and transaction records cannot be edited or deleted; corrections must use compensating entries.
- These database safeguards are not considered production-verified until the migration and constraint triggers pass against a disposable PostgreSQL database, including valid balanced entries, unbalanced entries, mixed currencies, duplicate idempotency keys, and attempted ledger edits.

API response amounts use integer minor units as strings (for USD, cents) to avoid precision loss. A missing account is not the same as a funded or active wallet.

## Wallet top-up lifecycle
1. Customer selects Add funds and sees amount, currency, fees and terms.
2. API creates a pending top-up intent with an idempotency key.
3. Customer completes payment through an approved provider flow.
4. Server verifies the signed webhook and independently retrieves payment status when appropriate.
5. Only verified success posts the ledger credit.
6. Duplicate webhook deliveries return the previous result without another credit.
7. Reconciliation flags missing, duplicated, delayed or mismatched events.

Never credit based only on a client redirect or client-submitted success message.

## Domain checkout lifecycle
1. Search availability and fetch a current provider price.
2. Create a short-lived quote with currency, provider, TLD requirements, taxes/fees where applicable, and expiry.
3. Revalidate availability, price and requirements before committing.
4. Create an order and reserve wallet funds or create a direct payment intent.
5. Create a durable provider operation with a unique internal operation ID.
6. Submit registration only after payment is secured according to the selected payment model.
7. If provider success is confirmed, capture the hold/payment and complete the order.
8. If failure is confirmed, release the hold or refund according to policy.
9. If outcome is ambiguous, mark the order as needing reconciliation; do not blindly retry registration or charge again.
10. Deliver a receipt and synchronize the domain into the customer's portfolio.

Payment capture and domain registration cannot be one atomic transaction across external systems. Model intermediate states and compensating actions explicitly.

## Direct checkout
- Use hosted checkout or tokenized payment methods; do not store raw card data.
- Verify webhook signatures, timestamps and replay protections according to provider guidance.
- Deduplicate webhook events by provider event ID.
- Define authorization, capture, failure, chargeback, refund and delayed-response handling.
- Confirm USD settlement and support for DNSOil's incorporation and customer geographies before selecting a payment provider.

## Admin and customer safeguards
- Manual balance adjustments require authorization, a reason and an audit trail.
- Separate view-only support permissions from financial-adjustment permissions.
- Require stronger authentication for financial changes and high-risk account actions.
- Show transaction history, order references, receipts, refunds and pending states.
- Set limits and fraud checks for top-ups and purchases.
- Publish transparent refund, cancellation, failed-registration and renewal policies.
- Alert on reconciliation mismatches, unusual velocity and repeated failures.

## Payment provider decision
Not selected. Compare Ghanaian business onboarding, USD presentment/settlement, relevant payment methods, webhooks, refunds/disputes, fees, stored-value permission and supported countries. Keep payment providers behind an adapter.
