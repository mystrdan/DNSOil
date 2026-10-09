import DomainCheckForm from "./domain-check-form";

const features = [
  { number: "01", title: "Compare providers", copy: "Choose a registrar or hosting provider based on price, package and renewal terms." },
  { number: "02", title: "Manage in one place", copy: "Keep registrations, renewals and DNS controls together." },
  { number: "03", title: "Transparent pricing", copy: "See the provider price, DNSOil’s proposed 1% service fee and the final total before checkout." },
];

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="nav">
        <a className="wordmark" href="/" aria-label="DNSOil home"><span className="mark">D</span> DNSOil</a>
        <div className="navLinks"><a href="#features">Features</a><a href="/hosting">Hosting</a><a href="#status">Platform status</a><a href="/demo/dashboard">View demo</a><a className="navButton" href="/auth/signin">Sign in <span aria-hidden="true">↗</span></a></div>
      </nav>

      <section className="hero">
        <p className="eyebrow"><span className="pulse" /> THE DOMAIN WORKSPACE</p>
        <h1>Your domains.<br /><span>One place.</span></h1>
        <p className="intro">Compare registrars and hosting providers, choose the price and package that suit you, then manage your services from one straightforward dashboard.</p><a className="homeDemoLink" href="/demo/providers">Preview provider comparison and the 1% fee <span aria-hidden="true">↗</span></a>
        <DomainCheckForm />
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
        <p>Provider choice and transparent pricing are being built. Live provider prices, availability checks, checkout, payments and DNS operations will only appear after integrations are verified.</p>
      </section>

      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>One workspace for every domain.</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
