const domains = [
  { name: "northstar.example", status: "Active", renewal: "18 Mar 2027", provider: "DNSOil demo" },
  { name: "mybrand.example", status: "Active", renewal: "02 Jun 2027", provider: "DNSOil demo" },
  { name: "sample-site.example", status: "Needs attention", renewal: "12 Nov 2026", provider: "DNSOil demo" },
];

const hostingServices = [
  { product: "Starter Web Hosting", domain: "northstar.example", provider: "Example Host (demo)", plan: "Starter", status: "Active", renewal: "24 Feb 2027" },
  { product: "Business Hosting", domain: "mybrand.example", provider: "Example Host (demo)", plan: "Business", status: "Active", renewal: "05 May 2027" },
];

export default function DemoDashboardPage() {
  return (
    <main className="dashboardShell demoShell">
      <div className="demoBanner"><span>DEMO MODE</span> Preview the signed-in DNSOil workspace. All names and account details are fictional.</div>
      <header className="dashboardNav">
        <a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a>
        <nav className="demoNav"><a href="/">Public homepage</a><a className="signOutButton" href="/auth/signin">Sign in</a></nav>
      </header>

      <section className="demoWelcome">
        <div>
          <p className="eyebrow demoEyebrow">YOUR WORKSPACE <span className="demoPill">PREVIEW</span></p>
          <h1>Good evening, Alex.</h1>
          <p className="intro">Your domains, hosting, renewals and DNS controls — together in one workspace.</p>
        </div>
        <a className="demoPrimaryButton" href="/#domain-search">+ Check a domain</a>
      </section>

      <section className="demoStats" aria-label="Account overview">
        <article className="demoStat"><span>Domains</span><strong>3</strong><small>Across connected providers</small></article>
        <article className="demoStat"><span>Hosting services</span><strong>2</strong><small>Fictional demo records</small></article>
        <article className="demoStat"><span>DNS status</span><strong className="demoHealthy"><i /> Operational</strong><small>Demo status, not a live check</small></article>
        <article className="demoStat demoWalletStat"><span>DNSOil Wallet</span><strong>Not enabled</strong><small>Funding and spending are disabled</small></article>
      </section>

      <section className="demoDomainSection">
        <div className="demoSectionHeading"><div><p className="eyebrow">DOMAIN PORTFOLIO</p><h2>Your domains</h2></div><span className="demoCount">3 SAMPLE RECORDS</span></div>
        <div className="demoTableWrap">
          <table className="demoTable">
            <thead><tr><th>Domain</th><th>Status</th><th>Renewal date</th><th>Provider</th><th /></tr></thead>
            <tbody>{domains.map((domain) => <tr key={domain.name}>
              <td><strong>{domain.name}</strong><small>Sample domain</small></td>
              <td><span className={domain.status === "Active" ? "domainStatus" : "domainStatus domainStatusWarn"}>{domain.status}</span></td>
              <td>{domain.renewal}</td><td>{domain.provider}</td><td><span className="demoMore">···</span></td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="demoDisclaimer">Illustrative interface only. Domain actions, registrar data, pricing, payments and DNS changes are not connected in this demo.</p>
      </section>

      <section className="demoDomainSection hostingDemoSection">
        <div className="demoSectionHeading"><div><p className="eyebrow">HOSTING PORTFOLIO</p><h2>Your hosting services</h2></div><span className="demoCount">2 FICTIONAL SERVICES</span></div>
        <div className="demoTableWrap">
          <table className="demoTable">
            <thead><tr><th>Service</th><th>Linked domain</th><th>Plan</th><th>Status</th><th>Renewal date</th><th>Provider</th></tr></thead>
            <tbody>{hostingServices.map((service) => <tr key={service.product}>
              <td><strong>{service.product}</strong><small>Provider-managed service</small></td>
              <td>{service.domain}</td><td>{service.plan}</td>
              <td><span className="domainStatus">{service.status}</span></td>
              <td>{service.renewal}</td><td>{service.provider}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="hostingSecurityNote"><strong>Control panel access</strong><p>When a real provider is connected, DNSOil can show its official portal or use provider-supported, short-lived SSO. cPanel/Plesk passwords are not stored in DNSOil.</p></div>
        <p className="demoDisclaimer">Example Host and all hosting records are fictional. No hosting provider, cPanel login or provisioning API is connected.</p>
      </section>
      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>Signed-in experience · Demo only</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
