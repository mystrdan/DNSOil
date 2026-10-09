# Google user provisioning

DNSOil provisions a database account after Google verifies the user's email, provided the web app's internal API settings are configured.

## Configuration

1. Apply the database schema using `pnpm --filter @dnsoil/api migrate` after setting the API's `DATABASE_URL`.
2. Generate a long random secret for server-to-server authentication. For example, use `openssl rand -hex 32`.
3. Set `DNSOIL_INTERNAL_API_SECRET` to the same secret in the API environment and the web app's server-side environment.
4. Set `DNSOIL_API_URL` in the web app to the private/reachable base URL of the Fastify API, such as `http://localhost:4000` for local development.
5. Set a second, independent `DNSOIL_API_TOKEN_SECRET` in both web and API environments. This key signs short-lived API access tokens; do not reuse the internal provisioning secret.
6. Configure Google OAuth using the instructions in [Google sign-in setup](google-sign-in.md).

Do not prefix the secret with `NEXT_PUBLIC_`, commit it, or expose it to browser code. Use TLS when the web app communicates with a remotely hosted API. Keep the API endpoint private where possible and rotate the shared secret if it may have been exposed.

## Flow and safeguards

- Auth.js accepts only Google sign-ins whose provider profile reports a verified email.
- When both internal API settings are present, the web server calls `POST /v1/internal/users/provision` before completing sign-in.
- The API requires the shared secret in the `x-dnsoil-internal-secret` header and a configured PostgreSQL connection.
- User emails are normalized to lowercase. Existing users are updated by email without resetting their account status.
- Suspended or closed accounts are not allowed through the provisioning callback.
- If provisioning is enabled but the API/database call fails, sign-in fails closed.
- If neither internal setting is configured, the OAuth scaffold remains usable without persistent provisioning. This is development scaffolding, not production-ready account persistence.

The internal endpoint does not accept browser credentials and is not a substitute for user-scoped API authorization. The web app can issue five-minute bearer tokens at `GET /api/access-token` for a signed-in session. The API validates signatures and expiry at `GET /v1/me`, then looks up the active account in PostgreSQL. The API token signing key is separate from the provisioning secret. These are the first authenticated API primitives; domain-management endpoints still need to apply the same user identity checks before they are added.
