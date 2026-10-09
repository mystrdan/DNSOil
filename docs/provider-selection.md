# Registrar and DNS Provider Evaluation

## Initial recommendation: evaluate Openprovider first
Openprovider is the first registrar integration candidate, not yet a final production commitment.

Its published API documentation describes:
- A reseller-oriented domain and hosting platform
- A REST/JSON API with bearer-token authentication
- Availability checks, registration, transfers, renewals, pricing, and DNS-zone/record operations
- A sandbox intended to use the same endpoint and payload contract without live registry calls or charges

Official references:
- Developer portal: https://developer.openprovider.com/
- Getting started: https://developer.openprovider.com/get-started.html
- API documentation: https://docs.openprovider.com/

These references establish that an API exists; they do not establish that DNSOil's account is approved, all desired TLDs are enabled, or that pricing and terms fit this business.

## Validate before final selection
1. Reseller onboarding and contractual permission to serve DNSOil customers.
2. Account funding, credit terms, settlement currency and minimum balance.
3. Wholesale pricing, premium domains, renewals, transfers, privacy and refund behavior.
4. Desired TLD coverage and per-TLD registration requirements.
5. Sandbox coverage for registration, failed orders, renewals, transfers and DNS.
6. Customer/domain contact model and ownership handling.
7. Nameserver updates, DNSSEC, webhooks and reconciliation support.
8. API limits, support SLA and escalation path.
9. Permission for the intended white-label experience and pricing.
10. Exportability and an exit plan if the provider changes.

## Comparison candidates

### Openprovider — preferred first evaluation
Reseller-oriented API, broad domain lifecycle coverage and published sandbox. Confirm commercial terms and actual TLD coverage.

### NameSilo — comparison candidate
Official API reference: https://www.namesilo.com/api-reference
Documents registration, renewal, transfers, availability and account-domain operations. Confirm reseller/white-label suitability, API behavior and commercial terms before using it as a multi-customer backend.

### Porkbun — comparison candidate, not assumed reseller provider
Official API documentation: https://porkbun.com/api/json/v3/documentation
Offers domain and DNS APIs and sandbox keys. Its documentation says the API is not a reseller service as defined under ICANN's RAA and is intended for domains in the user's own account or on behalf of clients. Do not choose it as the core reseller integration without written confirmation that DNSOil's exact model is permitted.

## Integration acceptance checklist
- Sandbox credentials obtained and stored outside the repository.
- Availability and price quote work for the initial TLD shortlist.
- TLD registration requirements are validated before checkout.
- Sandbox registration can be created, retrieved and reconciled.
- Timeouts and duplicate requests do not create duplicate orders or charges.
- Renewals and transfers have documented status mapping.
- Nameserver updates are supported and verified.
- DNS record management is tested separately from registration.
- Provider account balance and order costs can be reconciled.
- Support can trace an internal operation ID to provider references.
- Production pricing, reseller rights, customer terms, support and refund rules are approved.

## First integration scope
Implement the common contract needed for MVP: availability/quote, register, retrieve/list, renew, transfer-in/status, nameserver update, registration requirements and provider-operation status. Put optional capabilities behind capability flags.

DNS is a separate adapter. Start with registrar DNS if the chosen registrar supports required operations, then add an independent DNS provider after the domain lifecycle is stable.
