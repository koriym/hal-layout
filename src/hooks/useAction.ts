/**
 * useAction Hook
 *
 * Hook for executing actions on HAL link relations.
 * Handles POST, PUT, DELETE operations with automatic cache invalidation.
 */

import { useCallback, useState, useMemo } from 'react';
import { useHypermediaContext } from '../context/HypermediaContext';
import { useHalClient } from '../context/HalProvider';
import { expandUriTemplate, type TemplateParams } from '../utils/uriTemplate';
import type { HalLink } from '../types/hal';

/**
 * HTTP methods supported for actions
 */
export type ActionMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Options for useAction hook
 */
export interface UseActionOptions {
  /** Relation name to follow */
  rel: string;
  /** HTTP method (default: 'POST') */
  method?: ActionMethod;
  /** URI template parameters */
  params?: TemplateParams;
  /** Callback on successful action */
  onSuccess?: (response: unknown) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Relations to invalidate after successful action */
  invalidates?: string[];
  /** Whether to refresh the parent resource after action */
  refreshParent?: boolean;
}

/**
 * Return type for useAction hook
 */
export interface UseActionResult<TBody = unknown, TResponse = unknown> {
  /** Execute the action */
  execute: (body?: TBody) => Promise<TResponse | null>;
  /** Whether action is currently executing */
  loading: boolean;
  /** Error from last execution */
  error: Error | null;
  /** Reset error state */
  resetError: () => void;
  /** Whether the link relation exists */
  available: boolean;
  /** The link object (if available) */
  link: HalLink | null;
  /** The resolved href (with template params expanded) */
  href: string | null;
}

/**
 * Hook for executing actions on HAL link relations
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const { execute, loading, error } = useAction({
 *     rel: 'delete',
 *     method: 'DELETE',
 *     onSuccess: () => alert('Deleted!'),
 *   });
 *
 *   return (
 *     <button onClick={() => execute()} disabled={loading}>
 *       {loading ? 'Deleting...' : 'Delete'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAction<TBody = unknown, TResponse = unknown>(
  options: UseActionOptions
): UseActionResult<TBody, TResponse> {
  const { rel, method = 'POST', params, onSuccess, onError, invalidates, refreshParent = true } = options;

  const { resource, state, refresh } = useHypermediaContext();
  const client = useHalClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get the link for this relation
  const linkData = state?.data?._links?.[rel];
  const link = linkData
    ? Array.isArray(linkData)
      ? linkData[0]
      : linkData
    : null;
  const available = link !== null;

  // Resolve URI template with params
  const href = useMemo(() => {
    if (!link?.href) return null;
    if (params && Object.keys(params).length > 0) {
      return expandUriTemplate(link.href, params);
    }
    return link.href;
  }, [link?.href, params]);

  // Execute the action
  const execute = useCallback(
    async (body?: TBody): Promise<TResponse | null> => {
      if (!href) {
        const err = new Error(`Link relation '${rel}' not found`);
        setError(err);
        onError?.(err);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Follow the link and execute the action (using resolved href)
        const targetResource = resource.go(href);
        let response: unknown;

        switch (method) {
          case 'GET':
            response = await targetResource.get();
            break;
          case 'POST':
            response = await targetResource.post({ data: body });
            break;
          case 'PUT':
            response = await targetResource.put({ data: body });
            break;
          case 'PATCH':
            response = await targetResource.patch({ data: body });
            break;
          case 'DELETE':
            response = await targetResource.delete();
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        // Invalidate specified resources
        if (invalidates) {
          for (const invalidateRel of invalidates) {
            const invalidateLink = state?.data?._links?.[invalidateRel];
            if (invalidateLink) {
              const invalidateHref = Array.isArray(invalidateLink)
                ? invalidateLink[0].href
                : invalidateLink.href;
              const invalidateResource = client.go(invalidateHref);
              await invalidateResource.refresh().catch(() => {
                // Ignore refresh errors
              });
            }
          }
        }

        // Refresh parent resource
        if (refreshParent) {
          await refresh();
        }

        onSuccess?.(response);
        return response as TResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [href, rel, resource, method, state, client, invalidates, refreshParent, refresh, onSuccess, onError]
  );

  // Reset error state
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    resetError,
    available,
    link,
    href,
  };
}
