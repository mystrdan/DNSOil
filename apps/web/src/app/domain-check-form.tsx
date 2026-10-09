"use client";

import { useState, type FormEvent } from "react";

type QuoteAmount = { providerPriceMinor: string | null; dnsoilFeeMinor: string | null; customerTotalMinor: string | null; currency: string };
type ProviderQuote = {
  id: string;
  providerKey: string;
  providerName: string;
  available: boolean;
  registration: QuoteAmount;
  renewal: QuoteAmount;
  transfer: QuoteAmount;
  termYears: number;
  checkedAt: string;
  expiresAt: string;
};
type ValidationResult = { domain?: string; valid?: boolean; code?: string; message?: string; note?: string };
type QuoteResult = { quoteStatus?: string; quotes?: ProviderQuote[]; note?: string; message?: string };

function money(minor: string | null, currency: string): string {
  if (minor === null) return "—";
  const value = Number(minor) / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default function DomainCheckForm() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [quotes, setQuotes] = useState<ProviderQuote[]>([]);
  const [quoteNote, setQuoteNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setQuotes([]);
    setQuoteNote("");
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
      } else {
        const normalizedDomain = data.domain ?? domain;
        setResult(data);
        setDomain(normalizedDomain);
        try {
          const quoteResponse = await fetch(`/api/marketplace/domain-quotes?domain=${encodeURIComponent(normalizedDomain)}`, { cache: "no-store" });
          const quoteData = (await quoteResponse.json()) as QuoteResult;
          if (!quoteResponse.ok) setQuoteNote(quoteData.message ?? "Provider quotes are temporarily unavailable.");
          else {
            setQuotes(quoteData.quotes ?? []);
            setQuoteNote(quoteData.note ?? "");
          }
        } catch {
          setQuoteNote("Provider comparison is not reachable right now. Your domain format is valid, but availability is not confirmed.");
        }
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
      <p className="note">Searches provider quotes when integrations are connected. Syntax validation alone never confirms availability.</p>
      {error ? <p className="domainFeedback domainError" role="alert">{error}</p> : null}
      {result?.valid ? (
        <section className="providerComparison" aria-live="polite">
          <div className="comparisonHeading">
            <div><p className="eyebrow">DOMAIN SEARCH</p><h2>{result.domain}</h2></div>
            <span className="quoteBadge">Format valid</span>
          </div>
          {quotes.length ? (
            <>
              <p className="comparisonIntro">Compare connected registrars. DNSOil's 1% platform fee is included in customer totals; renewal pricing is shown separately.</p>
              <div className="providerQuoteList">
                {quotes.map((quote) => (
                  <article className={selectedProvider === quote.id ? "providerQuote selectedQuote" : "providerQuote"} key={quote.id}>
                    <div className="providerQuoteTop">
                      <div><strong>{quote.providerName}</strong><span>{quote.available ? "Availability reported by provider" : "Reported unavailable"}</span></div>
                      <div className="providerPrice"><strong>{money(quote.registration.customerTotalMinor, quote.registration.currency)}</strong><span>first term · {quote.termYears} {quote.termYears === 1 ? "year" : "years"}</span></div>
                    </div>
                    <div className="providerQuoteDetails">
                      <span>Provider price: {money(quote.registration.providerPriceMinor, quote.registration.currency)}</span>
                      <span>DNSOil fee: {money(quote.registration.dnsoilFeeMinor, quote.registration.currency)}</span>
                      <span>Renewal: {money(quote.renewal.customerTotalMinor, quote.renewal.currency)}</span>
                    </div>
                    <button type="button" className="providerSelectButton" disabled={!quote.available} onClick={() => setSelectedProvider(quote.id)}>
                      {selectedProvider === quote.id ? "Selected" : quote.available ? "Choose provider" : "Unavailable"}
                    </button>
                    {selectedProvider === quote.id ? <p className="selectionNotice">Provider selected for comparison. Checkout will be enabled after this provider's registration adapter and payment flow are connected.</p> : null}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="noProviderQuotes">
              <strong>No live registrar quotes yet</strong>
              <p>{quoteNote || "DNSOil hasn't connected a registrar with fresh pricing for this domain yet."}</p>
              <span>We won't invent availability or prices. Provider selection will appear here when real quote integrations are ready.</span>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
