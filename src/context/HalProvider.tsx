/**
 * HalProvider - Root Provider for HAL Hypermedia
 *
 * This component must wrap your application to provide the Ketting client
 * to all HypermediaLayout components.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Client } from 'ketting';
import { createHalClient, type HalClientOptions } from '../engine/client';

/**
 * Context for the Ketting client
 */
const HalClientContext = createContext<Client | null>(null);

/**
 * Props for HalProvider
 */
export interface HalProviderProps {
  /** Base URL for API requests */
  baseUrl: string;
  /** Optional custom Ketting client (if not provided, one will be created) */
  client?: Client;
  /** Additional client options */
  options?: Omit<HalClientOptions, 'baseUrl'>;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component that initializes and provides the Ketting client
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <HalProvider baseUrl="https://api.example.com">
 *       <HypermediaLayout uri="/posts">
 *         <PostList />
 *       </HypermediaLayout>
 *     </HalProvider>
 *   );
 * }
 * ```
 */
export function HalProvider({
  baseUrl,
  client: customClient,
  options,
  children,
}: HalProviderProps): JSX.Element {
  const client = useMemo(() => {
    if (customClient) {
      return customClient;
    }
    return createHalClient({ baseUrl, ...options });
  }, [baseUrl, customClient, options]);

  return <HalClientContext.Provider value={client}>{children}</HalClientContext.Provider>;
}

/**
 * Hook to access the Ketting client
 * @throws Error if used outside of HalProvider
 */
export function useHalClient(): Client {
  const client = useContext(HalClientContext);
  if (!client) {
    throw new Error('useHalClient must be used within a <HalProvider>.');
  }
  return client;
}

/**
 * Hook to check if HalProvider is available
 */
export function useHasHalProvider(): boolean {
  const client = useContext(HalClientContext);
  return client !== null;
}
