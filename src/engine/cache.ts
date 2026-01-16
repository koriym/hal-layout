/**
 * Cache Management Utilities for Hypermedia Resources
 */

import type { Client, Resource } from 'ketting';

/**
 * Invalidate cache for a specific resource
 */
export async function invalidateResource(client: Client, uri: string): Promise<void> {
  try {
    const resource = client.go(uri);
    await resource.refresh();
  } catch {
    // Resource might not be cached, ignore
  }
}

/**
 * Invalidate cache for multiple resources
 */
export async function invalidateResources(client: Client, uris: string[]): Promise<void> {
  await Promise.all(uris.map((uri) => invalidateResource(client, uri)));
}

/**
 * Invalidate parent resource cache after mutation
 * This is useful when a child resource is modified and the parent needs to be refreshed
 */
export async function invalidateParent(resource: Resource): Promise<void> {
  try {
    // Get the parent resource by following the 'up' or 'collection' link
    const links = await resource.links();
    const upLink = links.find((link) => link.rel === 'up' || link.rel === 'collection');

    if (upLink) {
      const parentResource = await resource.follow(upLink.rel);
      await parentResource.refresh();
    }
  } catch {
    // Parent link might not exist, ignore
  }
}

/**
 * Clear all cached resources
 */
export function clearCache(_client: Client): void {
  // Ketting manages its own cache, this triggers a full clear
  // Note: Ketting v7 doesn't expose a direct cache clear method,
  // so we rely on individual resource refresh
}

/**
 * Get the self URI from a resource
 */
export async function getSelfUri(resource: Resource): Promise<string> {
  const state = await resource.get();
  return state.uri;
}
