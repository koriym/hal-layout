/**
 * hal-layout
 *
 * React components for declaratively rendering HAL resources.
 * HAL structure maps directly to React component structure.
 *
 * @packageDocumentation
 */

// === Components ===
export { Hal } from './components/Hal';
export type { HalProps } from './components/Hal';

export { HalEmbedded } from './components/HalEmbedded';
export type { HalEmbeddedProps, HalEmbeddedRenderProps } from './components/HalEmbedded';

export { HalLink } from './components/HalLink';
export type { HalLinkProps, HalLinkRenderProps } from './components/HalLink';

// === Context & Providers ===
export { HalProvider, useHalClient, useHasHalProvider } from './context/HalProvider';
export type { HalProviderProps } from './context/HalProvider';

export {
  HypermediaContext,
  useHypermediaContext,
  useResourceData,
  useEmbedded,
  useHasLink,
  useLinkHref,
} from './context/HypermediaContext';
export type { HypermediaContextType } from './context/HypermediaContext';

// === Hooks ===
export { useHypermedia } from './hooks/useHypermedia';
export type { UseHypermediaResult } from './hooks/useHypermedia';

export { useAction } from './hooks/useAction';
export type { UseActionOptions, UseActionResult, ActionMethod } from './hooks/useAction';

// === Engine ===
export {
  createHalClient,
  initializeHalClient,
  getHalClient,
  isHalClientInitialized,
  resetHalClient,
} from './engine/client';
export type { HalClientOptions, Client } from './engine/client';

export {
  invalidateResource,
  invalidateResources,
  invalidateParent,
  clearCache,
  getSelfUri,
} from './engine/cache';

// === Types ===
export type {
  HalResource,
  HalLink as HalLinkType,
  HalLinks,
  HalEmbedded as HalEmbeddedType,
  HalTemplate,
  HalTemplateProperty,
  HalTemplateOption,
  HalTemplates,
  HalResourceData,
} from './types/hal';

export {
  isHalResource,
  isHalResourceArray,
  getEmbedded,
  getLink,
  getTemplate,
} from './types/hal';

// === Utils ===
export { expandUriTemplate, isUriTemplate } from './utils/uriTemplate';
export type { TemplateParams } from './utils/uriTemplate';
