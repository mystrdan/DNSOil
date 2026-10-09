"use client";

import { useMemo, useState } from "react";

type Service = "domains" | "hosting";
type Offer = {
  id: string;
  provider: string;
  product: string;
  detail: string;
  baseMinor: number;
  term: string;
  tag?: string;
};

const domainOffers: Offer[] = [
  { id: "reg-a", provider: "Example Registrar A", product: ".com registration", detail: "Standard registration · privacy not confirmed", baseMinor: 1299, term: "1 year", tag: "Lowest sample price" },
  { id: "reg-b", provider: "Example Registrar B", product: ".com registration", detail: "Standard registration · privacy not confirmed", baseMinor: 1450, term: "1 year" },
  { id: "reg-c", provider: "Example Registrar C", product: ".com registration", detail: "Standard registration · privacy not confirmed", baseMinor: 1699, term: "1 year" },
];
const hostingOffers: Offer[] = [
  { id: "host-a", provider: "Example Host A", product: "Starter Web Hosting", detail: "10 GB storage · SSL availability subject to provider", baseMinor: 3500, term: "per month", tag: "Lowest sample price" },
  { id: "host-b", provider: "Example Host B", product: "Shared Hosting", detail: "25 GB storage · cPanel availability subject to provider", baseMinor: 4900, term: "per month" },
  { id: "host-c", provider: "Example Host C", product: "Business Hosting", detail: "50 GB storage · backups subject to provider", baseMinor: 7500, term: "per month" },
];

function money(minor: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minor / 100);
}

export default function ProviderComparisonDemo() {
  const [service, setService] = useState<Service>("domains");
  const [selected, setSelected] = useState("reg-a");
  const [sort, setSort] = useState<"price" | "provider">("price");
  const offers = useMemo(() => [...(service === "domains" ? domainOffers : hostingOffers)].sort((a, b) => sort === "price" ? a.baseMinor - b.baseMinor : a.provider.localeCompare(b.provider)), [service, sort]);
  const selectedOffer = offers.find((offer) => offer.id === selected) ?? offers[0]!;
  const fee = Math.ceil(selectedOffer.baseMinor * 0.01);

  function changeService(next: Service) {
    setService(next);
    setSelected(next === "domains" ? "reg-a" : "host-a");
  }

  return (
    <main className="providerDemoShell">
      <nav className="providerDemoNav">
        <a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a>
        <a className="signOutButton" href="/demo/dashboard">Dashboard preview ↗</a>
      </nav>
      <div className="providerDemoBanner"><strong>INTERACTIVE DEMO</strong> All providers, package details and prices on this page are fictional examples, not live quotes.</div>
      <header className="providerDemoHero">
        <p className="eyebrow">YOUR CHOICE, ONE WORKSPACE</p>
        <h1>Compare providers.<br /><span>Choose your deal.</span></h1>
        <p className="intro">Choose a registrar or hosting company based on price and package. DNSOil shows its fee separately before checkout.</p>
      </header>
      <section className="providerCompare" aria-label="Provider comparison">
        <div className="providerControls">
          <div className="providerTabs" role="group" aria-label="Service type">
            <button type="button" className={service === "domains" ? "providerTab active" : "providerTab"} onClick={() => changeService("domains")}>Domain registration</button>
            <button type="button" className={service === "hosting" ? "providerTab active" : "providerTab"} onClick={() => changeService("hosting")}>Web hosting</button>
          </div>
          <label className="providerSort">Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as "price" | "provider")}>
              <option value="price">Lowest price</option>
              <option value="provider">Provider name</option>
            </select>
          </label>
        </div>
        <div className="providerOfferGrid">
          {offers.map((offer) => {
            const feeMinor = Math.ceil(offer.baseMinor * 0.01);
            const isSelected = selectedOffer.id === offer.id;
            return <article className={isSelected ? "providerOffer selected" : "providerOffer"} key={offer.id}>
              <div className="providerOfferTop">
                <span className="providerLogo">{offer.provider.slice(-1)}</span>
                <span className="providerName">{offer.provider}</span>
                {offer.tag ? <span className="providerTag">{offer.tag}</span> : null}
              </div>
              <h2>{offer.product}</h2>
              <p className="providerOfferDetail">{offer.detail}</p>
              <p className="providerPrice">{money(offer.baseMinor)}<span> / {offer.term}</span></p>
              <p className="providerFeeLine">DNSOil fee (1%): <strong>{money(feeMinor)}</strong></p>
              <p className="providerTotalLine">Illustrative total <strong>{money(offer.baseMinor + feeMinor)}</strong></p>
              <button type="button" className={isSelected ? "providerChoose chosen" : "providerChoose"} onClick={() => setSelected(offer.id)}>{isSelected ? "Selected for preview ✓" : "Choose provider"}</button>
            </article>;
          })}
        </div>
        <aside className="providerCheckoutPreview">
          <div><p className="eyebrow">YOUR SELECTION</p><h2>{selectedOffer.provider} · {selectedOffer.product}</h2><p>Example only. A real checkout will re-check availability, provider price, renewal terms and taxes before you confirm.</p></div>
          <div className="providerCheckoutAmounts"><span>Provider price <strong>{money(selectedOffer.baseMinor)}</strong></span><span>DNSOil service fee · 1% <strong>{money(fee)}</strong></span><span className="providerCheckoutTotal">Illustrative total <strong>{money(selectedOffer.baseMinor + fee)}</strong></span></div>
        </aside>
        <p className="providerLegalNote">Prices are sample values used to preview the experience. No registrar or hosting provider is connected, no service is reserved, and no purchase or payment can be made from this demo. Actual pricing, taxes, renewal costs and included features will depend on each provider.</p>
      </section>
      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>Compare openly. Choose freely.</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
