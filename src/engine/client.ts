/**
 * HAL Ketting Client Wrapper
 * Provides Ketting client configured for HAL resources
 */

import { Client } from 'ketting';

/**
 * Configuration options for HAL client
 */
export interface HalClientOptions {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default fetch options */
  fetchInit?: RequestInit;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
}

/**
 * Resolve relative URI to absolute URL
 */
function resolveUri(uri: string, baseUrl: string): string {
  // Already an absolute URL
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  // Relative path - prepend base URL
  return baseUrl.replace(/\/$/, '') + (uri.startsWith('/') ? uri : '/' + uri);
}

/**
 * Create a Ketting client configured for HAL
 */
export function createHalClient(options: HalClientOptions): Client {
  const { baseUrl, fetchInit, headers } = options;

  const client = new Client(baseUrl);

  // Configure fetch wrapper for URI resolution
  const originalFetch = client.fetcher.fetch.bind(client.fetcher);
  client.fetcher.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Resolve relative URIs to absolute URLs
    url = resolveUri(url, baseUrl);

    // Merge headers
    const mergedHeaders = new Headers(init?.headers);

    // Add custom headers
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        mergedHeaders.set(key, value);
      }
    }

    // Apply default fetch init options
    if (fetchInit?.headers) {
      const initHeaders = new Headers(fetchInit.headers);
      initHeaders.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    }

    // Ensure Accept header includes HAL
    if (!mergedHeaders.has('Accept')) {
      mergedHeaders.set('Accept', 'application/hal+json, application/json');
    }

    return originalFetch(url, { ...init, headers: mergedHeaders });
  };

  return client;
}

/**
 * Default client instance (must be initialized with createHalClient)
 */
let defaultClient: Client | null = null;

/**
 * Initialize the default HAL client
 */
export function initializeHalClient(options: HalClientOptions): Client {
  defaultClient = createHalClient(options);
  return defaultClient;
}

/**
 * Get the default HAL client
 * @throws Error if client is not initialized
 */
export function getHalClient(): Client {
  if (!defaultClient) {
    throw new Error(
      'HAL client is not initialized. Call initializeHalClient() or wrap your app in <HalProvider>.'
    );
  }
  return defaultClient;
}

/**
 * Check if the default client is initialized
 */
export function isHalClientInitialized(): boolean {
  return defaultClient !== null;
}

/**
 * Reset the default client (mainly for testing)
 */
export function resetHalClient(): void {
  defaultClient = null;
}

export type { Client };
