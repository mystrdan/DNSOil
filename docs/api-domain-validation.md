# API domain validation, readiness and migrations

## Domain syntax validation

`POST /v1/domains/validate`

Request:

```json
{ "domain": "Example.COM." }
```

A valid response normalizes the domain to lowercase ASCII (including IDN conversion) and removes one trailing dot. This endpoint validates syntax only: it does **not** check registrar availability, pricing, ownership, or registration eligibility.

The public homepage includes a format-check form that calls the web route `POST /api/domains/validate`, which proxies to the API. It reports valid syntax only and explicitly does not confirm that a domain is available.

## Authenticated account endpoint

- `GET /api/access-token` issues a five-minute bearer token to an authenticated web session when `DNSOIL_API_TOKEN_SECRET` is configured.
- `GET /v1/me` validates that token and looks up an active account in PostgreSQL.
- Configure the same dedicated `DNSOIL_API_TOKEN_SECRET` in the web and API server environments. Keep it separate from `DNSOIL_INTERNAL_API_SECRET`.
- The token endpoint and `/v1/me` are initial authentication primitives; future domain, order, DNS and wallet endpoints must enforce user-scoped authorization too.

## Readiness

- `GET /health` reports that the process is responding.
- `GET /ready` checks `SELECT 1` against PostgreSQL when `DATABASE_URL` is configured.
- Without `DATABASE_URL`, readiness reports `degraded` and `database: not-configured`; it does not claim database readiness.
- If PostgreSQL is configured but unavailable, `/ready` returns HTTP 503.

## Running migrations

Set `DATABASE_URL` to the intended PostgreSQL database, then run from the repository root:

```sh
pnpm --filter @dnsoil/api migrate
```

The runner takes a PostgreSQL advisory lock, records applied filenames in `schema_migrations`, and runs each unapplied numbered SQL migration in its own transaction. Back up important data and review migrations before applying them to a non-development database. The runner has not yet been validated against a production database.

Copy `apps/api/.env.example` to your local environment and adjust credentials to match your local Compose setup. Never commit real credentials.
