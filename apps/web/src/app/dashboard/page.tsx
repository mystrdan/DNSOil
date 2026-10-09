import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="dashboardShell">
      <header className="dashboardNav">
        <a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}>
          <button className="signOutButton" type="submit">Sign out</button>
        </form>
      </header>
      <section className="dashboardWelcome">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Welcome{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.</h1>
        <p className="intro">Your domains, DNS and hosting services will come together here as provider integrations become available.</p>
        <div className="dashboardNotice">
          <span className="statusDot" />
          <div><strong>Signed in</strong><p>{session.user.email}</p></div>
        </div>
        <section className="hostingPanel" aria-labelledby="hosting-title">
          <div className="hostingPanelHeading">
            <div><p className="eyebrow">WEB HOSTING</p><h2 id="hosting-title">Your hosting services</h2></div>
            <span className="hostingStatus">Not connected</span>
          </div>
          <p className="hostingDescription">When a hosting provider is connected, your plans, linked domains, renewal dates and provider portal will appear here. Hosting details come from the company where the hosting service was purchased — not automatically from your domain registrar.</p>
          <div className="hostingSecurityNote"><strong>Account security</strong><p>DNSOil will not ask you to store your cPanel or Plesk password here. Where supported, secure one-click access can use a short-lived provider login; otherwise you will open the provider's own portal.</p></div>
          <div className="hostingPanelFooter"><span>No hosting provider is connected yet.</span><span className="hostingComingSoon">Provider integration in progress</span></div>
        </section>
        <section className="walletPanel" aria-labelledby="wallet-title">
          <div className="walletPanelHeading">
            <div><p className="eyebrow">DNSOIL WALLET</p><h2 id="wallet-title">Your wallet</h2></div>
            <span className="walletStatus">Not enabled</span>
          </div>
          <p className="walletBalance">— <span>USD</span></p>
          <p className="walletDescription">Your wallet balance and transaction history will appear here when wallet services are enabled.</p>
          <div className="walletPanelFooter"><span>Deposits and spending are currently disabled.</span><button type="button" disabled aria-disabled="true">Add funds</button></div>
        </section>
        <p className="note">Early build · Domain registration, DNS changes and live hosting controls are not connected yet.</p>
      </section>
    </main>
  );
}
