/**
 * HypermediaContext - React Context for Hypermedia State
 *
 * Provides both the resource handle (for actions) and state (for display)
 * to child components within a HypermediaLayout.
 */

import { createContext, useContext } from 'react';
import type { Resource, State } from 'ketting';
import type { HalResource } from '../types/hal';

/**
 * Context value type for Hypermedia state
 * @typeParam T - Type of the resource data
 */
export interface HypermediaContextType<T = unknown> {
  /** Ketting Resource object for performing actions (follow, post, put, delete) */
  resource: Resource<HalResource<T>>;
  /** Current state of the resource (data, links, embedded) */
  state: State<HalResource<T>>;
  /** Loading indicator */
  loading: boolean;
  /** Error if request failed */
  error: Error | null;
  /** Refresh the resource state */
  refresh: () => Promise<void>;
}

/**
 * React Context for Hypermedia state
 */
export const HypermediaContext = createContext<HypermediaContextType | null>(null);

/**
 * Hook to access the current Hypermedia context
 * @throws Error if used outside of HypermediaLayout
 */
export function useHypermediaContext<T = unknown>(): HypermediaContextType<T> {
  const context = useContext(HypermediaContext);
  if (!context) {
    throw new Error(
      'useHypermediaContext must be used within a <HypermediaLayout> or <InboundLink>.'
    );
  }
  return context as HypermediaContextType<T>;
}

/**
 * Hook to access just the resource data (without HAL metadata)
 */
export function useResourceData<T = unknown>(): T | null {
  const { state, loading } = useHypermediaContext<T>();
  if (loading || !state) return null;

  const data = state.data;
  if (!data) return null;

  // Extract data excluding HAL properties
  const { _links, _embedded, _templates, ...resourceData } = data;
  return resourceData as T;
}

/**
 * Hook to access embedded resources
 */
export function useEmbedded<T = unknown>(rel: string): T | T[] | null {
  const { state, loading } = useHypermediaContext();
  if (loading || !state) return null;

  const embedded = state.data?._embedded?.[rel];
  if (!embedded) return null;

  return embedded as T | T[];
}

/**
 * Hook to check if a link relation exists
 */
export function useHasLink(rel: string): boolean {
  const { state, loading } = useHypermediaContext();
  if (loading || !state) return false;

  return state.data?._links?.[rel] !== undefined;
}

/**
 * Hook to get link href by relation
 */
export function useLinkHref(rel: string): string | null {
  const { state, loading } = useHypermediaContext();
  if (loading || !state) return null;

  const link = state.data?._links?.[rel];
  if (!link) return null;

  if (Array.isArray(link)) {
    return link[0]?.href ?? null;
  }
  return link.href;
}
