export type CurrencyCode = "USD";

export type DomainAvailabilityStatus = "available" | "unavailable" | "premium" | "unknown";

export type CatalogServiceType = "domain-registration" | "domain-renewal" | "domain-transfer" | "hosting";

export interface ProviderPriceBreakdown {
  readonly currency: CurrencyCode;
  readonly providerPriceMinor: string;
  readonly dnsoilFeeBps: number;
  readonly dnsoilFeeMinor: string;
  readonly totalPriceMinor: string;
}

export interface ProviderCatalogOffer extends ProviderPriceBreakdown {
  readonly id: string;
  readonly provider: { readonly key: string; readonly name: string; readonly category: "registrar" | "hosting" };
  readonly serviceType: CatalogServiceType;
  readonly productKey: string;
  readonly productName: string;
  readonly domainTld: string | null;
  readonly termMonths: number;
  readonly priceValidUntil: string;
  readonly syncedAt: string;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface DomainSearchResult {
  readonly domain: string;
  readonly status: DomainAvailabilityStatus;
  readonly currency: CurrencyCode;
  /** Integer minor units (US cents for USD); avoid floating-point money. */
  readonly registrationPriceMinor?: number;
  readonly renewalPriceMinor?: number;
  readonly providerId?: string;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
}

export interface HealthResponse {
  readonly status: "ok" | "degraded";
  readonly service: string;
  readonly timestamp: string;
}
