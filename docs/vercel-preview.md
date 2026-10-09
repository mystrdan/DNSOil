# Vercel preview and demo workflow

## Project

- Vercel project: `dnsoil-web`
- Git repository: `mystrdan/DNSOil`
- Production branch: `main`
- Root directory: `apps/web`
- Framework: Next.js
- Project dashboard: https://vercel.com/capsicom/dnsoil-web
- Stable deployment alias: https://dnsoil-web.vercel.app/

Vercel is connected to GitHub. Commits pushed to `main` automatically trigger a deployment. Review the latest deployment in the Vercel dashboard and wait for its state to become Ready before treating a change as live.

## Screens to review

- Public homepage: https://dnsoil-web.vercel.app/
- Sign-in screen: https://dnsoil-web.vercel.app/auth/signin
- Public signed-in dashboard mockup: https://dnsoil-web.vercel.app/demo/dashboard

The dashboard demo is intentionally public and clearly marked as a demo. It uses fictional account information and reserved `.example` domain names. It is not connected to user accounts, a registrar, payments or DNS changes. Use it to review layout and interaction direction without needing Google OAuth.

## Preview protection

The Vercel project inherits team deployment protection. If a direct link opens a Vercel authentication/protection page, use the approved shareable preview link from the Vercel dashboard. Do not disable protection for the entire project just to share a mockup. Keep any bypass secret private and rotate/revoke it if it is exposed.

## Google OAuth setup

Real sign-in requires server-side environment variables in Vercel:

- `AUTH_SECRET`: a long random secret.
- `AUTH_GOOGLE_ID`: Google OAuth client ID.
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret.

Register this authorized redirect URI in the Google OAuth client:

`https://dnsoil-web.vercel.app/api/auth/callback/google`

Also configure these only when the corresponding server services are ready:

- `DNSOIL_API_URL`: reachable base URL of the deployed DNSOil API.
- `DNSOIL_INTERNAL_API_SECRET`: same high-entropy server-to-server secret in the web and API environments.
- `DNSOIL_API_TOKEN_SECRET`: a separate high-entropy signing secret shared by the web and API environments.

Never use a `NEXT_PUBLIC_` prefix for secrets. Do not add placeholder or fake credentials to enable the sign-in flow. After adding or changing environment variables, redeploy and test the full OAuth callback. Until valid Google credentials are configured, use the public dashboard demo to review the signed-in UI.

## Build review checklist

After each significant commit to `main`:

1. Confirm the newest Vercel deployment reaches Ready.
2. Open the homepage and check the responsive layout.
3. Test the syntax-only domain form with a valid domain, an invalid domain and an IDN.
4. Open `/auth/signin` and verify the demo link.
5. Open `/demo/dashboard` on desktop and mobile widths.
6. Verify that the demo clearly states that all records are fictional and that no real domain operations are available.
7. Review GitHub Actions for typecheck, API tests and workspace builds.

A successful Vercel build proves that the web project builds; it does not prove OAuth, PostgreSQL, registrar availability, payments or DNS operations work end-to-end.
