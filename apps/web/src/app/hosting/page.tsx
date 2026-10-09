"use client";

import { useEffect, useState } from "react";

type Offer = {
  id: string;
  providerKey: string;
  providerName: string;
  productName: string;
  planName: string | null;
  description: string | null;
  price: { providerPriceMinor: string; dnsoilFeeMinor: string; customerTotalMinor: string; currency: string };
  renewalPrice: { providerPriceMinor: string | null; dnsoilFeeMinor: string | null; customerTotalMinor: string | null; currency: string };
  billingPeriod: string;
  storageGb: string | null;
  bandwidthGb: string | null;
  includesEmail: boolean;
  includesSsl: boolean;
  controlPanel: string | null;
  productUrl: string | null;
  lastSyncedAt: string;
};

type OfferResponse = { offers?: Offer[]; note?: string; message?: string };

function money(minor: string | null, currency: string) {
  if (minor === null) return "Not supplied";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(minor) / 100);
  } catch {
    return `${currency} ${(Number(minor) / 100).toFixed(2)}`;
  }
}

export default function HostingMarketplacePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [note, setNote] = useState("Loading provider catalog…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/marketplace/hosting-offers", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as OfferResponse;
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
        <div className="navLinks"><a href="/#features">Features</a><a href="/demo/dashboard">View demo</a><a className="navButton" href="/auth/signin">Sign in <span aria-hidden="true">↗</span></a></div>
      </nav>
      <section className="marketplaceHero">
        <p className="eyebrow"><span className="pulse" /> HOSTING MARKETPLACE</p>
        <h1>Find a plan.<br /><span>Keep control.</span></h1>
        <p className="intro">Compare hosting providers in one place. See plan features, renewal prices and DNSOil's fee before choosing a provider.</p>
        <p className="marketplaceFeeNote">Transparent pricing · 1% DNSOil platform fee on listed provider prices</p>
      </section>

      <section className="marketplaceResults">
        <div className="comparisonHeading"><div><p className="eyebrow">CONNECTED PROVIDERS</p><h2>Hosting plans</h2></div><span className="quoteBadge">{offers.length} {offers.length === 1 ? "offer" : "offers"}</span></div>
        {loading ? <div className="noProviderQuotes"><strong>Loading provider catalog…</strong></div> : offers.length ? (
          <div className="hostingOfferGrid">
            {offers.map((offer) => (
              <article className="hostingOffer" key={offer.id}>
                <p className="offerProvider">{offer.providerName}</p>
                <h3>{offer.productName}</h3>
                {offer.planName ? <p className="offerPlan">{offer.planName}</p> : null}
                <p className="offerPrice">{money(offer.price.customerTotalMinor, offer.price.currency)}<span> / {offer.billingPeriod}</span></p>
                <p className="offerPriceBreakdown">Provider {money(offer.price.providerPriceMinor, offer.price.currency)} + DNSOil {money(offer.price.dnsoilFeeMinor, offer.price.currency)} fee</p>
                <div className="offerSpecs">
                  {offer.storageGb ? <span>{offer.storageGb} GB storage</span> : null}
                  {offer.bandwidthGb ? <span>{offer.bandwidthGb} GB bandwidth</span> : null}
                  {offer.includesEmail ? <span>Email included</span> : null}
                  {offer.includesSsl ? <span>SSL included</span> : null}
                  {offer.controlPanel ? <span>{offer.controlPanel === "cpanel" ? "cPanel" : offer.controlPanel === "plesk" ? "Plesk" : offer.controlPanel}</span> : null}
                </div>
                <p className="offerRenewal">Renewal: {money(offer.renewalPrice.customerTotalMinor, offer.renewalPrice.currency)}</p>
                <button type="button" className="providerSelectButton" disabled>Choose plan · Checkout not connected</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="noProviderQuotes">
            <strong>No hosting providers connected yet</strong>
            <p>{note}</p>
            <span>Once an authorized hosting provider is connected, its actual catalog and renewal pricing will appear here. No sample prices are presented as live offers.</span>
          </div>
        )}
        {offers.length ? <p className="marketplaceFootnote">{note} Prices and renewal terms must be reconfirmed with the provider before checkout.</p> : null}
      </section>
      <footer><a className="wordmark" href="/"><span className="mark">D</span> DNSOil</a><span>Provider comparison · Early build</span><span>© {new Date().getFullYear()} DNSOil</span></footer>
    </main>
  );
}
