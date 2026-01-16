import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Hal } from '../../src/components/Hal';
import { HalProvider } from '../../src/context/HalProvider';
import { useHypermedia } from '../../src/hooks/useHypermedia';
import { MockClient } from '../mocks/ketting';
import type { HalResource } from '../../src/types/hal';

// Mock ketting module
vi.mock('ketting', () => ({
  Client: vi.fn(),
}));

interface TestData {
  title: string;
  content: string;
}

const mockHalResource: HalResource<TestData> = {
  title: 'Test Title',
  content: 'Test Content',
  _links: {
    self: { href: '/posts/1' },
    edit: { href: '/posts/1/edit' },
  },
  _embedded: {
    author: {
      name: 'John Doe',
      _links: { self: { href: '/authors/1' } },
    },
  },
};

// Test component that uses the hypermedia context
function TestConsumer() {
  const { data, loading, error } = useHypermedia<TestData>();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}

describe('Hal', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = new MockClient(mockHalResource);
    mockClient.setResource('/posts/1', mockHalResource);
  });

  it('should render loading state initially', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as unknown as ReturnType<typeof vi.fn>}>
        <Hal uri="/posts/1" fallback={<div>Loading...</div>}>
          <TestConsumer />
        </Hal>
      </HalProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render children with resource data', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as unknown as ReturnType<typeof vi.fn>}>
        <Hal uri="/posts/1">
          <TestConsumer />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render error state on failure', async () => {
    mockClient.setResource('/posts/error', {} as HalResource, new Error('Fetch failed'));

    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as unknown as ReturnType<typeof vi.fn>}>
        <Hal
          uri="/posts/error"
          errorFallback={(error) => <div>Custom Error: {error.message}</div>}
        >
          <TestConsumer />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Error: Fetch failed')).toBeInTheDocument();
    });
  });

  it('should call onLoad callback when resource is loaded', async () => {
    const onLoad = vi.fn();

    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as unknown as ReturnType<typeof vi.fn>}>
        <Hal uri="/posts/1" onLoad={onLoad}>
          <TestConsumer />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should call onError callback when fetch fails', async () => {
    mockClient.setResource('/posts/error', {} as HalResource, new Error('Fetch failed'));
    const onError = vi.fn();

    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as unknown as ReturnType<typeof vi.fn>}>
        <Hal uri="/posts/error" onError={onError}>
          <TestConsumer />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
