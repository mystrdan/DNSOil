# Google sign-in setup

DNSOil web authentication uses Auth.js with Google OAuth. Real OAuth credentials are required; the sign-in UI alone does not make Google sign-in operational.

## Configure locally

1. Create an OAuth 2.0 Client ID in Google Cloud Console for a Web application.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`.
4. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`. Generate a secret with `npx auth secret`.
5. Run the web app and visit `/auth/signin`.

For production, add `https://YOUR_DOMAIN/api/auth/callback/google` as an authorized redirect URI and set the environment variables in the deployment platform's encrypted environment settings. Never commit real credentials.

## Scope and limitations

- Google sign-in only; no password form.
- Only Google profiles with a verified email are accepted.
- Auth.js uses encrypted JWT sessions for this first milestone.
- The dashboard is a starter page; domain actions and API authorization still need implementation.
- Provisioning signed-in users into DNSOil's PostgreSQL `app_users` table and mobile sign-in are not implemented yet.
