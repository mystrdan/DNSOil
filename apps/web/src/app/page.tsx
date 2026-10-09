const features = [
  { number: "01", title: "Search domains", copy: "Check availability across connected registrars from one place." },
  { number: "02", title: "Manage in one place", copy: "Keep registrations, renewals and DNS controls together." },
  { number: "03", title: "Clear pricing", copy: "See provider pricing and DNSOil fees before checkout." },
];

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="nav">
        <a className="wordmark" href="/" aria-label="DNSOil home"><span className="mark">D</span> DNSOil</a>
        <div className="navLinks"><a href="#features">Features</a><a href="#status">Platform status</a><a className="navButton" href="/auth/signin">Sign in <span aria-hidden="true">↗</span></a></div>
      </nav>

      <section className="hero">
        <p className="eyebrow"><span className="pulse" /> THE DOMAIN WORKSPACE</p>
        <h1>Your domains.<br /><span>One place.</span></h1>
        <p className="intro">Search, register and manage domains through one straightforward dashboard — without juggling registrar accounts.</p>
        <div className="search" id="domain-search">
          <label className="srOnly" htmlFor="domain">Search for a domain</label>
          <input id="domain" name="domain" placeholder="yourbrand.com" autoComplete="off" />
          <a className="searchAction" href="/auth/signin">Sign in to get started <span aria-hidden="true">→</span></a>
        </div>
        <p className="note">Early build · Search and checkout are not connected yet.</p>
      </section>

      <section className="featureGrid" id="features" aria-label="Platform features">
        {features.map((feature) => <article className="feature" key={feature.number}>
          <span className="featureNumber">{feature.number}</span>
          <h2>{feature.title}</h2>
          <p>{feature.copy}</p>
        </article>)}
      </section>

      <section className="status" id="status">
        <div><span className="statusDot" /> Platform status</div>
        <p>Workspace scaffold is in progress. Registrar integrations, accounts, payments and DNS operations will be added and tested in stages.</p>
      </section>

      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>One workspace for every domain.</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
