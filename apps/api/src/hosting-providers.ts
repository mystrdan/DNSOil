/**
 * Provider-neutral contract for future hosting integrations.
 * Registrar integrations and hosting integrations are separate adapters: a domain's
 * registrar is not assumed to be its web-hosting provider. Implementations map provider
 * responses into this normalized model. Never persist a cPanel/Plesk password; prefer
 * provider-supported short-lived SSO when one-click control-panel login is implemented.
 */
export type HostingServiceStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "overdue"
  | "cancelled"
  | "unknown";

export interface HostingServiceSnapshot {
  externalServiceId: string;
  customerEmail: string;
  productName: string;
  primaryDomain?: string | null;
  planName?: string | null;
  status: HostingServiceStatus;
  renewalAt?: string | null;
  /** Stable HTTPS landing URL only; never a session-bearing SSO URL. */
  controlPanelUrl?: string | null;
}

export interface HostingProviderCapabilities {
  listServices: boolean;
  serviceStatus: boolean;
  renewalDate: boolean;
  stableControlPanelUrl: boolean;
  shortLivedControlPanelSso: boolean;
  suspendService: boolean;
  cancelService: boolean;
}

export interface HostingProviderAdapter {
  readonly providerKey: string;
  readonly displayName: string;
  readonly capabilities: HostingProviderCapabilities;
  listServices(): Promise<HostingServiceSnapshot[]>;
  /** Optional provider-supported SSO; return an ephemeral URL and never store it. */
  createControlPanelSsoUrl?(externalServiceId: string): Promise<string>;
}
