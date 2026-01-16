/**
 * HalEmbedded - Renders _embedded resources
 *
 * Renders embedded resources from _embedded by relation name.
 * Does NOT make additional HTTP requests - it only renders what's already embedded.
 *
 * @example
 * ```tsx
 * // Single embedded resource
 * <HalEmbedded<Author> rel="author">
 *   {({ data }) => <span>{data.name}</span>}
 * </HalEmbedded>
 *
 * // Collection of embedded resources
 * <HalEmbedded<Comment> rel="comments" renderItem={(comment) => (
 *   <CommentCard key={comment.id} {...comment} />
 * )} />
 * ```
 */

import React, { useMemo, type ReactNode } from 'react';
import { useHalClient } from '../context/HalProvider';
import { HypermediaContext, useHypermediaContext } from '../context/HypermediaContext';
import type { HalResource } from '../types/hal';
import type { Resource, State } from 'ketting';

/**
 * Render props for single embedded resource
 */
export interface HalEmbeddedRenderProps<T> {
  /** Resource data (excluding HAL metadata) */
  data: T;
  /** Full HAL resource data */
  halData: HalResource<T>;
  /** Index in collection (0 for single resources) */
  index: number;
}

/**
 * Props for HalEmbedded component
 */
export interface HalEmbeddedProps<T = unknown> {
  /** Relation name to look up in _embedded */
  rel: string;
  /** Render function for single resource (receives render props) */
  children?: (props: HalEmbeddedRenderProps<T>) => ReactNode;
  /** Render function for each item in a collection */
  renderItem?: (item: T, index: number, halData: HalResource<T>) => ReactNode;
  /** Fallback content when embedded resource is not found */
  fallback?: ReactNode;
  /** Wrapper element for collections (default: React.Fragment) */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
  /** Key extractor for collection items */
  keyExtractor?: (item: T, index: number) => string | number;
}

/**
 * Extract data from HAL resource (excluding HAL metadata)
 */
function extractData<T>(halResource: HalResource<T>): T {
  const { _links, _embedded, _templates, ...data } = halResource;
  return data as T;
}

/**
 * Create a mock Resource and State for embedded resources
 * This allows nested HalEmbedded to work with embedded data
 */
function createEmbeddedContext<T>(
  halResource: HalResource<T>,
  client: ReturnType<typeof useHalClient>,
  parentRefresh: () => Promise<void>
) {
  // Create a minimal Resource-like object for embedded data
  // Note: Embedded resources don't have their own URI in Ketting context
  const selfLink = halResource._links?.self?.href;
  const mockResource = selfLink ? client.go<HalResource<T>>(selfLink) : null;

  // Create a State-like object (minimal subset for embedded resources)
  const state = {
    uri: selfLink ?? '',
    data: halResource,
    headers: new Headers(),
    links: [],
  } as unknown as State<HalResource<T>>;

  return {
    resource: mockResource as Resource<HalResource<T>>,
    state,
    loading: false,
    error: null,
    refresh: parentRefresh,
  };
}

/**
 * HalEmbedded component
 *
 * Renders embedded HAL resources synchronously (no HTTP requests).
 * Supports both single resources and collections.
 */
export function HalEmbedded<T = unknown>({
  rel,
  children,
  renderItem,
  fallback = null,
  wrapper: Wrapper,
  keyExtractor,
}: HalEmbeddedProps<T>): JSX.Element | null {
  const { state, refresh } = useHypermediaContext();
  const client = useHalClient();

  // Get embedded resource(s)
  const embedded = useMemo(() => {
    return state?.data?._embedded?.[rel] ?? null;
  }, [state, rel]);

  // No embedded resource found
  if (!embedded) {
    return <>{fallback}</>;
  }

  // Handle array of embedded resources
  if (Array.isArray(embedded)) {
    const items = embedded as HalResource<T>[];

    const renderedItems = items.map((halResource, index) => {
      const data = extractData<T>(halResource);
      const key = keyExtractor ? keyExtractor(data, index) : index;

      if (renderItem) {
        // Wrap each item in its own context
        const embeddedContext = createEmbeddedContext(halResource, client, refresh);

        return (
          <HypermediaContext.Provider key={key} value={embeddedContext}>
            {renderItem(data, index, halResource)}
          </HypermediaContext.Provider>
        );
      }

      if (children) {
        const embeddedContext = createEmbeddedContext(halResource, client, refresh);

        return (
          <HypermediaContext.Provider key={key} value={embeddedContext}>
            {children({ data, halData: halResource, index })}
          </HypermediaContext.Provider>
        );
      }

      return null;
    });

    if (Wrapper) {
      return <Wrapper>{renderedItems}</Wrapper>;
    }

    return <>{renderedItems}</>;
  }

  // Handle single embedded resource
  const halResource = embedded as HalResource<T>;
  const data = extractData<T>(halResource);
  const embeddedContext = createEmbeddedContext(halResource, client, refresh);

  if (children) {
    return (
      <HypermediaContext.Provider value={embeddedContext}>
        {children({ data, halData: halResource, index: 0 })}
      </HypermediaContext.Provider>
    );
  }

  if (renderItem) {
    return (
      <HypermediaContext.Provider value={embeddedContext}>
        {renderItem(data, 0, halResource)}
      </HypermediaContext.Provider>
    );
  }

  return <>{fallback}</>;
}
