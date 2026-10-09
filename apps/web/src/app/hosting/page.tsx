"use client";

import { useEffect, useState } from "react";

type CatalogOffer = {
  id: string;
  provider: { key: string; name: string; category: string };
  serviceType: string;
  productKey: string;
  productName: string;
  domainTld: string | null;
  termMonths: number;
  currency: string;
  providerPriceMinor: string;
  dnsoilFeeBps: number;
  dnsoilFeeMinor: string;
  totalPriceMinor: string;
  priceValidUntil: string;
  syncedAt: string;
  attributes: Record<string, unknown>;
};
type CatalogResponse = { offers?: CatalogOffer[]; note?: string; message?: string };

function money(minor: string, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(minor) / 100);
  } catch {
    return `${currency} ${(Number(minor) / 100).toFixed(2)}`;
  }
}

function attributeText(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

export default function HostingMarketplacePage() {
  const [offers, setOffers] = useState<CatalogOffer[]>([]);
  const [note, setNote] = useState("Loading provider catalog…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/catalog/offers?serviceType=hosting&currency=USD", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as CatalogResponse;
        if (!response.ok) throw new Error(data.message ?? "Hosting offers are temporarily unavailable.");
        if (active) {
          setOffers(data.offers ?? []);
          setNote(data.note ?? "");
        }
      })
      .catch((error: unknown) => {
        if (active) setNote(error instanceof Error ? error.message : "Hosting offers are temporarily unavailable.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="shell marketplaceShell">
      <nav className="nav">
        <a className="wordmark" href="/" aria-label="DNSOil home"><span className="mark">D</span> DNSOil</a>
        <div className="navLinks"><a href="/#features">Features</a><a href="/demo/providers">Compare providers</a><a href="/demo/dashboard">View demo</a><a className="navButton" href="/auth/signin">Sign in <span aria-hidden="true">↗</span></a></div>
      </nav>
      <section className="marketplaceHero">
        <p className="eyebrow"><span className="pulse" /> HOSTING MARKETPLACE</p>
        <h1>Find a plan.<br /><span>Keep control.</span></h1>
        <p className="intro">Compare real catalog prices from connected hosting providers. Review plan details and DNSOil's fee before choosing a provider.</p>
        <p className="marketplaceFeeNote">Transparent pricing · 1% DNSOil platform fee on provider prices</p>
      </section>

      <section className="marketplaceResults">
        <div className="comparisonHeading"><div><p className="eyebrow">CONNECTED PROVIDERS</p><h2>Hosting plans</h2></div><span className="quoteBadge">{offers.length} {offers.length === 1 ? "offer" : "offers"}</span></div>
        {loading ? <div className="noProviderQuotes"><strong>Loading provider catalog…</strong></div> : offers.length ? (
          <div className="hostingOfferGrid">
            {offers.map((offer) => {
              const storage = attributeText(offer.attributes.storageGb);
              const bandwidth = attributeText(offer.attributes.bandwidthGb);
              const controlPanel = attributeText(offer.attributes.controlPanel);
              const renewalPrice = attributeText(offer.attributes.renewalPrice);
              return (
                <article className="hostingOffer" key={offer.id}>
                  <p className="offerProvider">{offer.provider.name}</p>
                  <h3>{offer.productName}</h3>
                  <p className="offerPlan">{offer.termMonths % 12 === 0 ? `${offer.termMonths / 12} year(s)` : `${offer.termMonths} months`}</p>
                  <p className="offerPrice">{money(offer.totalPriceMinor, offer.currency)}<span> / {offer.termMonths} months</span></p>
                  <p className="offerPriceBreakdown">Provider {money(offer.providerPriceMinor, offer.currency)} + DNSOil {money(offer.dnsoilFeeMinor, offer.currency)} fee</p>
                  <div className="offerSpecs">
                    {storage ? <span>{storage} GB storage</span> : null}
                    {bandwidth ? <span>{bandwidth} GB bandwidth</span> : null}
                    {offer.attributes.includesEmail === true ? <span>Email included</span> : null}
                    {offer.attributes.includesSsl === true ? <span>SSL included</span> : null}
                    {controlPanel ? <span>{controlPanel}</span> : null}
                  </div>
                  {renewalPrice ? <p className="offerRenewal">Provider-supplied renewal detail: {renewalPrice}</p> : null}
                  <p className="offerRenewal">Price valid until {new Date(offer.priceValidUntil).toLocaleDateString()}</p>
                  <button type="button" className="providerSelectButton" disabled>Choose plan · Checkout not connected</button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="noProviderQuotes">
            <strong>No hosting providers connected yet</strong>
            <p>{note}</p>
            <span>Once an authorized hosting provider supplies its catalog, real plan prices and features will appear here. No sample prices are presented as live offers.</span>
          </div>
        )}
        {offers.length ? <p className="marketplaceFootnote">{note} Confirm renewal terms, taxes and availability with the provider before checkout.</p> : null}
      </section>
      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>Provider comparison · Early build</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
