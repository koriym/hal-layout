/**
 * Mock implementations for Ketting
 */

import type { HalResource } from '../../src/types/hal';

export interface MockResourceOptions<T = unknown> {
  uri: string;
  data: HalResource<T>;
  error?: Error;
}

export class MockResource<T = unknown> {
  uri: string;
  private data: HalResource<T>;
  private error?: Error;

  constructor(options: MockResourceOptions<T>) {
    this.uri = options.uri;
    this.data = options.data;
    this.error = options.error;
  }

  async get() {
    if (this.error) throw this.error;
    return {
      uri: this.uri,
      data: this.data,
      headers: new Headers(),
      links: [],
    };
  }

  async refresh() {
    return this.get();
  }

  go<U = unknown>(uri: string): MockResource<U> {
    return new MockResource<U>({
      uri,
      data: {} as HalResource<U>,
    });
  }

  async post(_options?: { data?: unknown }) {
    if (this.error) throw this.error;
    return { uri: this.uri, data: this.data };
  }

  async put(_options?: { data?: unknown }) {
    if (this.error) throw this.error;
    return { uri: this.uri, data: this.data };
  }

  async patch(_options?: { data?: unknown }) {
    if (this.error) throw this.error;
    return { uri: this.uri, data: this.data };
  }

  async delete() {
    if (this.error) throw this.error;
    return { uri: this.uri, data: null };
  }

  async links() {
    return [];
  }

  async follow(_rel: string) {
    return new MockResource({ uri: this.uri, data: {} as HalResource });
  }
}

export class MockClient {
  private resources: Map<string, MockResource> = new Map();
  private defaultData: HalResource;

  constructor(defaultData: HalResource = { _links: { self: { href: '/' } } }) {
    this.defaultData = defaultData;
  }

  setResource<T>(uri: string, data: HalResource<T>, error?: Error) {
    this.resources.set(uri, new MockResource({ uri, data, error }));
  }

  go<T = unknown>(uri: string): MockResource<T> {
    const resource = this.resources.get(uri);
    if (resource) {
      return resource as MockResource<T>;
    }
    return new MockResource<T>({
      uri,
      data: this.defaultData as HalResource<T>,
    });
  }

  use(_middleware: unknown) {
    // Mock middleware
  }
}
