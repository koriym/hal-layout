/**
 * Simple URI Template expansion (RFC 6570 subset)
 *
 * Supports:
 * - Simple expansion: /posts/{id}
 * - Query expansion: /posts{?q,page}
 * - Query continuation: /posts?sort=date{&page,limit}
 */

export type TemplateParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Expand a URI template with the given parameters
 *
 * @example
 * ```ts
 * expandUriTemplate('/posts/{id}', { id: 123 })
 * // => '/posts/123'
 *
 * expandUriTemplate('/posts{?q,page}', { q: 'hello', page: 2 })
 * // => '/posts?q=hello&page=2'
 *
 * expandUriTemplate('/posts?sort=date{&page}', { page: 2 })
 * // => '/posts?sort=date&page=2'
 * ```
 */
export function expandUriTemplate(template: string, params: TemplateParams): string {
  if (!params || Object.keys(params).length === 0) {
    // Remove unexpanded template expressions
    return template.replace(/\{[^}]+\}/g, '');
  }

  let result = template;

  // Handle query string expansion: {?var1,var2}
  result = result.replace(/\{\?([^}]+)\}/g, (_, vars: string) => {
    const varNames = vars.split(',').map((v: string) => v.trim());
    const queryParts: string[] = [];

    for (const varName of varNames) {
      const value = params[varName];
      if (value !== undefined && value !== null && value !== '') {
        queryParts.push(`${encodeURIComponent(varName)}=${encodeURIComponent(String(value))}`);
      }
    }

    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  });

  // Handle query continuation: {&var1,var2}
  result = result.replace(/\{&([^}]+)\}/g, (_, vars: string) => {
    const varNames = vars.split(',').map((v: string) => v.trim());
    const queryParts: string[] = [];

    for (const varName of varNames) {
      const value = params[varName];
      if (value !== undefined && value !== null && value !== '') {
        queryParts.push(`${encodeURIComponent(varName)}=${encodeURIComponent(String(value))}`);
      }
    }

    return queryParts.length > 0 ? `&${queryParts.join('&')}` : '';
  });

  // Handle simple expansion: {var}
  result = result.replace(/\{([^?&}]+)\}/g, (_, varName: string) => {
    const value = params[varName.trim()];
    if (value !== undefined && value !== null) {
      return encodeURIComponent(String(value));
    }
    return '';
  });

  return result;
}

/**
 * Check if a URI is a template (contains template expressions)
 */
export function isUriTemplate(uri: string): boolean {
  return /\{[^}]+\}/.test(uri);
}
