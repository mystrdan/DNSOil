import type { CurrencyCode, DomainAvailabilityStatus } from "@dnsoil/shared";

export interface Money {
  /** Integer minor units (US cents for USD). */
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export interface RegistrarCapabilities {
  readonly availabilityCheck: boolean;
  readonly registration: boolean;
  readonly renewal: boolean;
  readonly transfer: boolean;
  readonly nameservers: boolean;
  readonly dnsRecords: boolean;
}

export interface AvailabilityQuery {
  readonly domain: string;
}

export interface AvailabilityResult {
  readonly domain: string;
  readonly status: DomainAvailabilityStatus;
  readonly registrationPrice?: Money;
  readonly renewalPrice?: Money;
  readonly providerId: string;
  readonly checkedAt: string;
}

export interface RegisterDomainCommand {
  readonly domain: string;
  readonly years: number;
  readonly registrantContactId: string;
  /** Stable key used to prevent duplicate operations after timeouts/retries. */
  readonly idempotencyKey: string;
}

export type ProviderOperationStatus =
  | "accepted"
  | "processing"
  | "succeeded"
  | "failed"
  | "unknown";

export interface ProviderOperationResult {
  readonly providerId: string;
  readonly providerOperationId?: string;
  readonly status: ProviderOperationStatus;
  readonly message?: string;
}

export type ProviderErrorCode =
  | "AUTHENTICATION_FAILED"
  | "RATE_LIMITED"
  | "INVALID_DOMAIN"
  | "UNSUPPORTED_TLD"
  | "INSUFFICIENT_PROVIDER_FUNDS"
  | "DOMAIN_UNAVAILABLE"
  | "OPERATION_REJECTED"
  | "PROVIDER_UNAVAILABLE"
  | "OUTCOME_UNKNOWN";

export class RegistrarAdapterError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    message: string,
    readonly retryable: boolean,
    readonly outcomeUnknown = false,
  ) {
    super(message);
    this.name = "RegistrarAdapterError";
  }
}

/**
 * Every registrar integration must implement this contract. Provider-specific
 * payloads, authentication and error formats stay inside the adapter.
 * Do not retry a registration blindly when outcomeUnknown is true.
 */
export interface RegistrarAdapter {
  readonly providerId: string;
  readonly displayName: string;
  readonly capabilities: RegistrarCapabilities;

  checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResult>;

  registerDomain?(
    command: RegisterDomainCommand,
  ): Promise<ProviderOperationResult>;

  getOperation?(providerOperationId: string): Promise<ProviderOperationResult>;
}
