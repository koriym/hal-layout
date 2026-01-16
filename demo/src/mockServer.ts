/**
 * Mock HAL Server
 *
 * Simulates HAL API responses for demo purposes.
 */

const mockData: Record<string, unknown> = {
  '/posts/1': {
    title: 'Introduction to HAL',
    body: 'HAL (Hypertext Application Language) is a simple format that gives a consistent and easy way to hyperlink between resources in your API. This demo shows how hal-layout makes it easy to render HAL resources declaratively in React.',
    _links: {
      self: { href: '/posts/1' },
      edit: { href: '/posts/1', title: 'Edit this post' },
      delete: { href: '/posts/1', title: 'Delete this post' },
      search: { href: '/posts{?q}', templated: true },
    },
    _embedded: {
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        _links: {
          self: { href: '/users/1' },
        },
      },
      comments: [
        {
          id: 1,
          text: 'Great article! HAL makes APIs so much more discoverable.',
          author: 'Alice',
          _links: { self: { href: '/comments/1' } },
        },
        {
          id: 2,
          text: 'Very helpful, thanks! The hal-layout library looks promising.',
          author: 'Bob',
          _links: { self: { href: '/comments/2' } },
        },
        {
          id: 3,
          text: 'I love how the component structure mirrors the HAL structure.',
          author: 'Charlie',
          _links: { self: { href: '/comments/3' } },
        },
      ],
    },
  },
  '/users/1': {
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer and HAL enthusiast',
    _links: {
      self: { href: '/users/1' },
      posts: { href: '/users/1/posts' },
    },
  },
};

interface MockResource {
  uri: string;
  go: (uri: string) => MockResource;
  get: () => Promise<MockState>;
  post: (options: { data: unknown }) => Promise<MockState>;
  put: (options: { data: unknown }) => Promise<MockState>;
  delete: () => Promise<void>;
  refresh: () => Promise<MockState>;
}

interface MockState {
  uri: string;
  data: unknown;
  headers: Headers;
}

function createMockResource(uri: string): MockResource {
  const resource: MockResource = {
    uri,
    go: (targetUri: string) => createMockResource(targetUri),
    get: async () => {
      await delay(300); // Simulate network delay
      const data = mockData[uri];
      if (!data) {
        throw new Error(`Resource not found: ${uri}`);
      }
      return {
        uri,
        data,
        headers: new Headers({ 'content-type': 'application/hal+json' }),
      };
    },
    post: async ({ data }) => {
      await delay(300);
      console.log('POST', uri, data);
      return { uri, data: mockData[uri], headers: new Headers() };
    },
    put: async ({ data }) => {
      await delay(300);
      console.log('PUT', uri, data);
      return { uri, data: mockData[uri], headers: new Headers() };
    },
    delete: async () => {
      await delay(300);
      console.log('DELETE', uri);
    },
    refresh: async () => {
      return resource.get();
    },
  };
  return resource;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MockClient {
  go: (uri: string) => MockResource;
}

export function createMockClient(): MockClient {
  return {
    go: (uri: string) => createMockResource(uri),
  };
}
