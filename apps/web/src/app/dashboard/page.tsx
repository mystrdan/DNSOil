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
        <p className="intro">Your DNSOil account is ready. Domain search and management will appear here as integrations come online.</p>
        <div className="dashboardNotice">
          <span className="statusDot" />
          <div><strong>Signed in</strong><p>{session.user.email}</p></div>
        </div>
        <p className="note">Early build · Domain registration and DNS management are not connected yet.</p>
      </section>
    </main>
  );
}
