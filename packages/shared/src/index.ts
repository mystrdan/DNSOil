export type CurrencyCode = "USD";

export type DomainAvailabilityStatus = "available" | "unavailable" | "premium" | "unknown";

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
