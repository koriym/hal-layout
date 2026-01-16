/**
 * HAL (Hypertext Application Language) Type Definitions
 * @see https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
 */

/**
 * HAL Link object
 */
export interface HalLink {
  /** URI of the linked resource */
  href: string;
  /** Whether the href is a URI template (RFC 6570) */
  templated?: boolean;
  /** Media type of the linked resource */
  type?: string;
  /** Human-readable identifier for the link */
  title?: string;
  /** Language of the linked resource */
  hreflang?: string;
  /** Deprecated indicator */
  deprecation?: string;
  /** Link name for distinguishing multiple links with same rel */
  name?: string;
  /** URI identifying the profile of the linked resource */
  profile?: string;
}

/**
 * HAL Links collection
 */
export interface HalLinks {
  /** Self link (required in HAL) */
  self: HalLink;
  /** Additional links indexed by relation name */
  [rel: string]: HalLink | HalLink[];
}

/**
 * HAL Embedded resources collection
 */
export interface HalEmbedded {
  /** Embedded resources indexed by relation name */
  [rel: string]: HalResource | HalResource[];
}

/**
 * HAL-FORMS Template Property
 * @see https://rwcbook.github.io/hal-forms/
 */
export interface HalTemplateProperty {
  /** Property name */
  name: string;
  /** Input type (text, hidden, number, date, etc.) */
  type?: string;
  /** Whether the property is required */
  required?: boolean;
  /** Default value */
  value?: unknown;
  /** Human-readable prompt/label */
  prompt?: string;
  /** Regex pattern for validation */
  regex?: string;
  /** Minimum value (for number/date types) */
  min?: number | string;
  /** Maximum value (for number/date types) */
  max?: number | string;
  /** Step value (for number types) */
  step?: number;
  /** Available options for select/radio inputs */
  options?: HalTemplateOption[];
  /** Read-only flag */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Number of rows (for textarea) */
  rows?: number;
  /** Number of columns (for textarea) */
  cols?: number;
}

/**
 * HAL-FORMS Template Option
 */
export interface HalTemplateOption {
  /** Option value */
  value: string;
  /** Human-readable prompt/label */
  prompt?: string;
  /** Whether this option is selected by default */
  selected?: boolean;
}

/**
 * HAL-FORMS Template
 */
export interface HalTemplate {
  /** HTTP method */
  method: string;
  /** Content-Type for the request */
  contentType?: string;
  /** Human-readable title */
  title?: string;
  /** Target URI (defaults to self link) */
  target?: string;
  /** Form properties/fields */
  properties?: HalTemplateProperty[];
}

/**
 * HAL-FORMS Templates collection
 */
export interface HalTemplates {
  /** Default template */
  default?: HalTemplate;
  /** Additional templates indexed by name */
  [name: string]: HalTemplate | undefined;
}

/**
 * HAL Resource
 * @typeParam T - Type of the resource data (excluding _links, _embedded, _templates)
 */
export type HalResource<T = Record<string, unknown>> = T & {
  /** Hyperlinks */
  _links?: HalLinks;
  /** Embedded resources */
  _embedded?: HalEmbedded;
  /** HAL-FORMS templates */
  _templates?: HalTemplates;
};

/**
 * Extract data type from HAL resource (excluding HAL metadata)
 */
export type HalResourceData<T extends HalResource> = Omit<T, '_links' | '_embedded' | '_templates'>;

/**
 * Type guard to check if a value is a HAL resource
 */
export function isHalResource(value: unknown): value is HalResource {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_links' in value &&
    typeof (value as HalResource)._links?.self?.href === 'string'
  );
}

/**
 * Type guard to check if embedded is an array
 */
export function isHalResourceArray(value: HalResource | HalResource[]): value is HalResource[] {
  return Array.isArray(value);
}

/**
 * Get embedded resource(s) by relation name
 */
export function getEmbedded<T extends HalResource = HalResource>(
  resource: HalResource,
  rel: string
): T | T[] | null {
  return (resource._embedded?.[rel] as T | T[] | undefined) ?? null;
}

/**
 * Get link(s) by relation name
 */
export function getLink(resource: HalResource, rel: string): HalLink | HalLink[] | null {
  return resource._links?.[rel] ?? null;
}

/**
 * Get template by name
 */
export function getTemplate(resource: HalResource, name: string = 'default'): HalTemplate | null {
  return resource._templates?.[name] ?? null;
}
