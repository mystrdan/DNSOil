import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || profile?.email_verified !== true) return false;

      const apiUrl = process.env.DNSOIL_API_URL;
      const internalSecret = process.env.DNSOIL_INTERNAL_API_SECRET;
      // Keep the OAuth scaffold usable before the internal API is configured.
      // If either setting is present, require both and fail closed on provisioning errors.
      if (!apiUrl && !internalSecret) return true;
      if (!apiUrl || !internalSecret || typeof profile.email !== "string") return false;

      try {
        const response = await fetch(new URL("/v1/internal/users/provision", apiUrl), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dnsoil-internal-secret": internalSecret,
          },
          body: JSON.stringify({
            email: profile.email,
            displayName: typeof profile.name === "string" ? profile.name : null,
          }),
          signal: AbortSignal.timeout(5_000),
          cache: "no-store",
        });
        if (!response.ok) return false;
        const user = (await response.json()) as { status?: string };
        return user.status === "active";
      } catch {
        return false;
      }
    },
  },
});
