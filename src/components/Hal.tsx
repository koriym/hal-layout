/**
 * Hal - Root component for HAL-driven UI
 *
 * Entry point for HAL-driven UI. Fetches a HAL resource and provides
 * its state to child components via React Context.
 *
 * @example
 * ```tsx
 * <Hal uri="/posts">
 *   <HalEmbedded rel="author">...</HalEmbedded>
 *   <HalLink rel="edit">Edit</HalLink>
 * </Hal>
 * ```
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Resource, State } from 'ketting';
import { useHalClient } from '../context/HalProvider';
import { HypermediaContext, type HypermediaContextType } from '../context/HypermediaContext';
import type { HalResource } from '../types/hal';

/**
 * Props for Hal
 */
export interface HalProps<T = unknown> {
  /** URI of the resource to fetch (supports app://self/, page://self/, or HTTP URLs) */
  uri: string;
  /** Content profile for content negotiation */
  profile?: string;
  /** View parameter for representation selection */
  view?: string;
  /** Fallback content to show while loading */
  fallback?: ReactNode;
  /** Error fallback renderer */
  errorFallback?: (error: Error) => ReactNode;
  /** Child components that will receive the hypermedia context */
  children: ReactNode;
  /** Callback when resource is successfully loaded */
  onLoad?: (state: State<HalResource<T>>) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error }: { error: Error }): JSX.Element {
  return (
    <div role="alert" style={{ color: 'red' }}>
      Error: {error.message}
    </div>
  );
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback(): JSX.Element {
  return <div>Loading...</div>;
}

/**
 * Hal component
 *
 * Fetches a HAL resource and provides its context to children.
 * This is the main entry point for hypermedia-driven UI.
 */
export function Hal<T = unknown>({
  uri,
  profile,
  view,
  fallback,
  errorFallback,
  children,
  onLoad,
  onError,
}: HalProps<T>): JSX.Element {
  const client = useHalClient();

  // State for resource, loading, and error
  const [resource, setResource] = useState<Resource<HalResource<T>> | null>(null);
  const [state, setState] = useState<State<HalResource<T>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Build the URI with optional profile/view parameters
  const resolvedUri = useMemo(() => {
    const url = new URL(uri, 'http://placeholder');
    if (profile) {
      url.searchParams.set('profile', profile);
    }
    if (view) {
      url.searchParams.set('view', view);
    }
    // Return just the path + query if it was a relative URL
    if (uri.startsWith('/') || uri.startsWith('app://') || uri.startsWith('page://')) {
      return uri.includes('?')
        ? `${uri}&${url.searchParams.toString()}`
        : `${uri}${url.searchParams.toString() ? '?' + url.searchParams.toString() : ''}`;
    }
    return url.toString();
  }, [uri, profile, view]);

  // Fetch the resource
  const fetchResource = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = client.go<HalResource<T>>(resolvedUri);
      const resourceState = await res.get();

      setResource(res);
      setState(resourceState);
      onLoad?.(resourceState);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [client, resolvedUri, onLoad, onError]);

  // Refresh function exposed via context
  const refresh = useCallback(async () => {
    if (resource) {
      setLoading(true);
      try {
        const newState = await resource.refresh();
        setState(newState);
        onLoad?.(newState);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    }
  }, [resource, onLoad, onError]);

  // Fetch on mount and when URI changes
  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  // Build context value
  const contextValue = useMemo((): HypermediaContextType<T> | null => {
    if (!resource || !state) return null;
    return {
      resource,
      state,
      loading,
      error,
      refresh,
    };
  }, [resource, state, loading, error, refresh]);

  // Render loading state
  if (loading && !state) {
    return <>{fallback ?? <DefaultLoadingFallback />}</>;
  }

  // Render error state
  if (error && !state) {
    return <>{errorFallback ? errorFallback(error) : <DefaultErrorFallback error={error} />}</>;
  }

  // Render children with context
  if (!contextValue) {
    return <>{fallback ?? <DefaultLoadingFallback />}</>;
  }

  return (
    <HypermediaContext.Provider value={contextValue as HypermediaContextType}>
      {children}
    </HypermediaContext.Provider>
  );
}
