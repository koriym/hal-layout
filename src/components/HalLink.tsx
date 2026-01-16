/**
 * HalLink - Renders _links actions
 *
 * Renders actions based on _links relations. Handles state transitions
 * via HTTP methods (GET, POST, PUT, DELETE). Supports URI templates.
 *
 * @example
 * ```tsx
 * // Simple delete button
 * <HalLink rel="delete" method="DELETE">
 *   Delete
 * </HalLink>
 *
 * // Navigation link
 * <HalLink rel="next">
 *   Next Page
 * </HalLink>
 *
 * // With URI template parameters
 * <HalLink rel="search" params={{ q: 'hello', page: 2 }}>
 *   Search
 * </HalLink>
 *
 * // With render props
 * <HalLink rel="submit" method="POST" body={{ status: 'approved' }}>
 *   {({ loading, execute }) => (
 *     <button onClick={execute} disabled={loading}>
 *       {loading ? 'Submitting...' : 'Approve'}
 *     </button>
 *   )}
 * </HalLink>
 * ```
 */

import { useCallback, type ReactNode, type MouseEvent, type KeyboardEvent } from 'react';
import { useAction, type ActionMethod } from '../hooks/useAction';
import type { TemplateParams } from '../utils/uriTemplate';

/**
 * Render props for HalLink
 */
export interface HalLinkRenderProps {
  /** Execute the action */
  execute: () => Promise<void>;
  /** Whether action is loading */
  loading: boolean;
  /** Error from action */
  error: Error | null;
  /** Whether the link is available */
  available: boolean;
  /** The link href */
  href: string | null;
}

/**
 * Props for HalLink component
 */
export interface HalLinkProps<TBody = unknown> {
  /** Relation name from _links */
  rel: string;
  /** HTTP method (default: 'GET' for 'a', 'POST' for 'button') */
  method?: ActionMethod;
  /** URI template parameters */
  params?: TemplateParams;
  /** Request body for POST/PUT/PATCH */
  body?: TBody;
  /** Callback on successful action */
  onSuccess?: (response: unknown) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Relations to invalidate after action */
  invalidates?: string[];
  /** Whether to refresh parent after action */
  refreshParent?: boolean;
  /** Element type to render */
  as?: 'button' | 'a' | 'span';
  /** Children - can be ReactNode or render function */
  children: ReactNode | ((props: HalLinkRenderProps) => ReactNode);
  /** Additional CSS class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Title/tooltip */
  title?: string;
  /** Prevent default navigation for 'a' elements */
  preventDefault?: boolean;
  /** Open in new tab (for 'a' elements with GET) */
  target?: '_blank' | '_self' | '_parent' | '_top';
}

/**
 * HalLink component
 *
 * Renders actionable links based on HAL _links relations.
 */
export function HalLink<TBody = unknown>({
  rel,
  method = 'GET',
  params,
  body,
  onSuccess,
  onError,
  invalidates,
  refreshParent = true,
  as,
  children,
  className,
  disabled: disabledProp,
  title,
  preventDefault = true,
  target,
}: HalLinkProps<TBody>): JSX.Element | null {
  // Determine element type based on method: GET → anchor, others → button
  const effectiveAs = as ?? (method === 'GET' ? 'a' : 'button');

  const { execute, loading, error, available, link, href } = useAction<TBody>({
    rel,
    method,
    params,
    onSuccess,
    onError,
    invalidates,
    refreshParent,
  });

  // Handle click
  const handleClick = useCallback(
    async (e: MouseEvent) => {
      // For 'a' elements with GET method, allow default navigation unless preventDefault
      if (effectiveAs === 'a' && method === 'GET' && !preventDefault) {
        return;
      }

      e.preventDefault();
      await execute(body);
    },
    [effectiveAs, method, preventDefault, execute, body]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        await execute(body);
      }
    },
    [execute, body]
  );

  // Don't render if link is not available
  if (!available) {
    return null;
  }

  const disabled = disabledProp || loading;

  // Render props for function children
  const renderProps: HalLinkRenderProps = {
    execute: () => execute(body).then(() => {}),
    loading,
    error,
    available,
    href,
  };

  // Render function children
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // Render based on element type
  const commonProps = {
    className,
    title: title ?? link?.title,
    onClick: handleClick,
    onKeyDown: effectiveAs !== 'a' && effectiveAs !== 'button' ? handleKeyDown : undefined,
  };

  if (effectiveAs === 'a') {
    return (
      <a
        {...commonProps}
        href={href ?? '#'}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        aria-disabled={disabled}
        style={disabled ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
      >
        {children}
      </a>
    );
  }

  if (effectiveAs === 'span') {
    return (
      <span
        {...commonProps}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        style={disabled ? { cursor: 'not-allowed', opacity: 0.5 } : { cursor: 'pointer' }}
      >
        {children}
      </span>
    );
  }

  // Default: button
  return (
    <button
      {...commonProps}
      type="button"
      disabled={disabled}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

