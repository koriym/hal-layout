/**
 * useHypermedia Hook
 *
 * Main hook for accessing hypermedia context within HypermediaLayout.
 * Provides access to resource data, links, embedded resources, and templates.
 */

import { useCallback, useMemo } from 'react';
import type { Resource, State } from 'ketting';
import {
  useHypermediaContext,
  useEmbedded as useContextEmbedded,
  useResourceData as useContextResourceData,
  useHasLink as useContextHasLink,
  useLinkHref as useContextLinkHref,
} from '../context/HypermediaContext';
import type { HalResource, HalLink, HalTemplate } from '../types/hal';

/**
 * Return type for useHypermedia hook
 */
export interface UseHypermediaResult<T = unknown> {
  /** Resource data (excluding HAL metadata) */
  data: T | null;
  /** Full HAL resource including _links, _embedded, _templates */
  halData: HalResource<T> | null;
  /** Ketting Resource object for actions */
  resource: Resource<HalResource<T>>;
  /** Current resource state */
  state: State<HalResource<T>>;
  /** Loading indicator */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh the resource */
  refresh: () => Promise<void>;
  /** Get embedded resource(s) by rel */
  getEmbedded: <E = unknown>(rel: string) => E | E[] | null;
  /** Get link by rel */
  getLink: (rel: string) => HalLink | HalLink[] | null;
  /** Check if link exists */
  hasLink: (rel: string) => boolean;
  /** Get template by name */
  getTemplate: (name?: string) => HalTemplate | null;
  /** Check if template exists */
  hasTemplate: (name?: string) => boolean;
}

/**
 * Main hook for accessing hypermedia context
 *
 * @example
 * ```tsx
 * function PostList() {
 *   const { data, loading, getEmbedded } = useHypermedia<{ title: string }>();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   const posts = getEmbedded<Post[]>('posts');
 *   return (
 *     <ul>
 *       {posts?.map(post => <li key={post.id}>{post.title}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useHypermedia<T = unknown>(): UseHypermediaResult<T> {
  const context = useHypermediaContext<T>();

  const { resource, state, loading, error, refresh } = context;

  // Extract data excluding HAL properties
  const data = useMemo((): T | null => {
    if (!state?.data) return null;
    const { _links, _embedded, _templates, ...resourceData } = state.data;
    return resourceData as T;
  }, [state]);

  // Get full HAL data
  const halData = useMemo((): HalResource<T> | null => {
    return state?.data ?? null;
  }, [state]);

  // Get embedded resource(s)
  const getEmbedded = useCallback(
    <E = unknown>(rel: string): E | E[] | null => {
      return (state?.data?._embedded?.[rel] as E | E[] | undefined) ?? null;
    },
    [state]
  );

  // Get link by rel
  const getLink = useCallback(
    (rel: string): HalLink | HalLink[] | null => {
      return state?.data?._links?.[rel] ?? null;
    },
    [state]
  );

  // Check if link exists
  const hasLink = useCallback(
    (rel: string): boolean => {
      return state?.data?._links?.[rel] !== undefined;
    },
    [state]
  );

  // Get template by name
  const getTemplate = useCallback(
    (name: string = 'default'): HalTemplate | null => {
      return state?.data?._templates?.[name] ?? null;
    },
    [state]
  );

  // Check if template exists
  const hasTemplate = useCallback(
    (name: string = 'default'): boolean => {
      return state?.data?._templates?.[name] !== undefined;
    },
    [state]
  );

  return {
    data,
    halData,
    resource,
    state,
    loading,
    error,
    refresh,
    getEmbedded,
    getLink,
    hasLink,
    getTemplate,
    hasTemplate,
  };
}

// Re-export convenience hooks
export { useContextEmbedded as useEmbedded };
export { useContextResourceData as useResourceData };
export { useContextHasLink as useHasLink };
export { useContextLinkHref as useLinkHref };
