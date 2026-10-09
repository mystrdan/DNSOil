const domains = [
  { name: "northstar.example", status: "Active", renewal: "18 Mar 2027", provider: "DNSOil demo" },
  { name: "mybrand.example", status: "Active", renewal: "02 Jun 2027", provider: "DNSOil demo" },
  { name: "sample-site.example", status: "Needs attention", renewal: "12 Nov 2026", provider: "DNSOil demo" },
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
          <p className="intro">Your domains, renewals and DNS controls — together in one workspace.</p>
        </div>
        <a className="demoPrimaryButton" href="/#domain-search">+ Check a domain</a>
      </section>

      <section className="demoStats" aria-label="Account overview">
        <article className="demoStat"><span>Domains</span><strong>3</strong><small>Across connected providers</small></article>
        <article className="demoStat"><span>Renewals in 30 days</span><strong>1</strong><small>One item to review</small></article>
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
      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>Signed-in experience · Demo only</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
