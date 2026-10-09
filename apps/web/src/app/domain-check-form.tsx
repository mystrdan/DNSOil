"use client";

import { useState, type FormEvent } from "react";

type ValidationResult = { domain?: string; valid?: boolean; code?: string; message?: string; note?: string };

export default function DomainCheckForm() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
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
        setResult(data);
        setDomain(data.domain ?? domain);
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
        <button type="submit" disabled={loading}>{loading ? "Checking…" : "Check format"}</button>
      </form>
      <p className="note">Format check only. Domain availability and pricing are not connected yet.</p>
      {error ? <p className="domainFeedback domainError" role="alert">{error}</p> : null}
      {result?.valid ? (
        <p className="domainFeedback domainSuccess" role="status">
          <strong>{result.domain}</strong> has a valid domain format. Availability is not confirmed.
        </p>
      ) : null}
    </>
  );
}
