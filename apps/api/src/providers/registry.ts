import type { RegistrarAdapter } from "./contract.js";

/**
 * In-memory adapter registry for the initial single-process API.
 * Provider credentials must be injected at runtime and never stored here.
 * The registry deliberately does not choose a provider based on user input.
 */
export class RegistrarRegistry {
  private readonly adapters = new Map<string, RegistrarAdapter>();

  register(adapter: RegistrarAdapter): void {
    const key = adapter.providerId.trim().toLowerCase();
    if (!key) throw new Error("Registrar providerId must not be empty.");
    if (this.adapters.has(key)) {
      throw new Error(`Registrar adapter already registered: ${key}`);
    }
    this.adapters.set(key, adapter);
  }

  get(providerId: string): RegistrarAdapter | undefined {
    return this.adapters.get(providerId.trim().toLowerCase());
  }

  list(): readonly Pick<RegistrarAdapter, "providerId" | "displayName" | "capabilities">[] {
    return [...this.adapters.values()].map(({ providerId, displayName, capabilities }) => ({
      providerId,
      displayName,
      capabilities,
    }));
  }
}
