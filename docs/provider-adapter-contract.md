# Registrar adapter contract

All registrar integrations are implemented behind the same TypeScript contract in `apps/api/src/providers/contract.ts`.

## Adapter responsibilities

- Normalize provider-specific availability responses to DNSOil's status vocabulary.
- Return prices as integer minor units with an explicit currency.
- Keep credentials, HTTP payloads, and provider error mapping inside the adapter.
- Expose capabilities so the product does not offer operations a provider cannot perform.
- Support idempotency and operation lookup wherever the upstream API permits it.

## Operation safety

A registration request is not considered failed merely because the HTTP request timed out. If the provider may have accepted the request, return or raise an unknown-outcome state and reconcile against the provider before retrying. The API must never blindly issue a second registration request.

No concrete registrar adapter is active yet. Openprovider remains a candidate pending sandbox credentials, commercial verification, TLD coverage review, and operational tests.
