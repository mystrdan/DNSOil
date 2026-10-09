import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "./google-sign-in-button";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="authShell">
      <a className="authBrand" href="/" aria-label="DNSOil home">
        <span className="mark">D</span><span>DNSOil</span>
      </a>
      <section className="authCard">
        <div className="authIcon"><span className="mark">D</span></div>
        <p className="authEyebrow">WELCOME TO DNSOIL</p>
        <h1 className="authTitle">Sign in</h1>
        <p className="authDescription">Sign in to manage your domains, DNS and renewals in one place.</p>
        <GoogleSignInButton />
        <p className="authFinePrint">By continuing, you agree to use DNSOil in accordance with our terms and privacy policy.</p>
      </section>
      <p className="authFooter">Want to look around first? <a href="/demo/dashboard">View the dashboard demo</a></p><p className="authFooter">Domains. DNS. One platform.</p>
    </main>
  );
}
