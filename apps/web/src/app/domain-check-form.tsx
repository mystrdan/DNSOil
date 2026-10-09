"use client";

import { useState, type FormEvent } from "react";

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
type ValidationResult = { domain?: string; valid?: boolean; code?: string; message?: string; note?: string };
type CatalogResult = { offers?: CatalogOffer[]; note?: string; message?: string };

function money(minor: string, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(minor) / 100);
  } catch {
    return `${currency} ${(Number(minor) / 100).toFixed(2)}`;
  }
}

function term(months: number): string {
  if (months % 12 === 0) return `${months / 12} ${months === 12 ? "year" : "years"}`;
  return `${months} months`;
}

export default function DomainCheckForm() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [offers, setOffers] = useState<CatalogOffer[]>([]);
  const [renewalOffers, setRenewalOffers] = useState<CatalogOffer[]>([]);
  const [catalogNote, setCatalogNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setOffers([]);
    setRenewalOffers([]);
    setCatalogNote("");
    setSelectedProvider("");
    setError("");
    try {
      const response = await fetch("/api/domains/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = (await response.json()) as ValidationResult;
      if (!response.ok) {
        setError(data.message ?? "We couldn't validate that domain format.");
        return;
      }

      const normalizedDomain = data.domain ?? domain;
      setResult(data);
      setDomain(normalizedDomain);
      const tld = normalizedDomain.split(".").at(-1) ?? "";
      try {
        const [catalogResponse, renewalResponse] = await Promise.all([
          fetch(`/api/catalog/offers?serviceType=domain-registration&tld=${encodeURIComponent(tld)}&currency=USD`, { cache: "no-store" }),
          fetch(`/api/catalog/offers?serviceType=domain-renewal&tld=${encodeURIComponent(tld)}&currency=USD`, { cache: "no-store" }),
        ]);
        const catalog = (await catalogResponse.json()) as CatalogResult;
        const renewalCatalog = (await renewalResponse.json()) as CatalogResult;
        if (!catalogResponse.ok) setCatalogNote(catalog.message ?? "Provider catalog is temporarily unavailable.");
        else {
          setOffers(catalog.offers ?? []);
          setRenewalOffers(renewalResponse.ok ? renewalCatalog.offers ?? [] : []);
          setCatalogNote(catalog.note ?? "");
        }
      } catch {
        setCatalogNote("Provider catalog is not reachable right now. Domain format is valid, but availability is not confirmed.");
      }
    } catch {
      setError("The domain validation service is not reachable right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="search" id="domain-search" onSubmit={submit}>
        <label className="srOnly" htmlFor="domain">Enter a domain name</label>
        <input
          id="domain"
          name="domain"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="yourbrand.com"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={253}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Checking…" : "Compare providers"}</button>
      </form>
      <p className="note">Checks domain format and looks for synchronized registrar prices. Availability is only confirmed by a registrar at checkout.</p>
      {error ? <p className="domainFeedback domainError" role="alert">{error}</p> : null}
      {result?.valid ? (
        <section className="providerComparison" aria-live="polite">
          <div className="comparisonHeading">
            <div><p className="eyebrow">REGISTRAR COMPARISON</p><h2>{result.domain}</h2></div>
            <span className="quoteBadge">Format valid</span>
          </div>
          <p className="comparisonIntro">Showing current catalog prices for .{result.domain?.split(".").at(-1)} products. DNSOil's 1% platform fee is itemized. This is not an availability check for the exact domain.</p>
          {offers.length ? (
            <div className="providerQuoteList">
              {offers.map((offer) => (
                <article className={selectedProvider === offer.id ? "providerQuote selectedQuote" : "providerQuote"} key={offer.id}>
                  <div className="providerQuoteTop">
                    <div><strong>{offer.provider.name}</strong><span>{offer.productName} · {term(offer.termMonths)}</span></div>
                    <div className="providerPrice"><strong>{money(offer.totalPriceMinor, offer.currency)}</strong><span>provider price + 1% DNSOil fee</span></div>
                  </div>
                  <div className="providerQuoteDetails">
                    <span>Provider: {money(offer.providerPriceMinor, offer.currency)}</span>
                    <span>DNSOil fee: {money(offer.dnsoilFeeMinor, offer.currency)}</span>
                    <span>Price expires: {new Date(offer.priceValidUntil).toLocaleDateString()}</span>
                    {(() => {
                      const renewal = renewalOffers.find((item) => item.provider.key === offer.provider.key);
                      return renewal ? <span>Renewal ({term(renewal.termMonths)}): {money(renewal.totalPriceMinor, renewal.currency)}</span> : null;
                    })()}
                  </div>
                  <button type="button" className="providerSelectButton" onClick={() => setSelectedProvider(offer.id)}>
                    {selectedProvider === offer.id ? "Selected" : "Choose provider"}
                  </button>
                  {selectedProvider === offer.id ? <p className="selectionNotice">Provider selected for comparison. Registration checkout and exact-domain availability checks will be enabled after this provider's live registrar adapter and payment flow are connected.</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="noProviderQuotes">
              <strong>No verified registrar prices yet</strong>
              <p>{catalogNote || "No active provider has supplied a fresh catalog price for this domain extension."}</p>
              <span>DNSOil does not invent availability or prices. Real provider offers will appear here when an authorized registrar integration is connected.</span>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
