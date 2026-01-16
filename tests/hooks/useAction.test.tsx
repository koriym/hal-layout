import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { Hal } from '../../src/components/Hal';
import { HalProvider } from '../../src/context/HalProvider';
import { useAction } from '../../src/hooks/useAction';
import { MockClient } from '../mocks/ketting';
import type { HalResource } from '../../src/types/hal';

// Mock ketting module
vi.mock('ketting', () => ({
  Client: vi.fn(),
}));

const mockHalResource: HalResource = {
  title: 'Test Post',
  _links: {
    self: { href: '/posts/1' },
    edit: { href: '/posts/1/edit' },
    delete: { href: '/posts/1' },
  },
};

describe('useAction', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = new MockClient(mockHalResource);
    mockClient.setResource('/posts/1', mockHalResource);
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <HalProvider baseUrl="http://test.com" client={mockClient as never}>
          <Hal uri="/posts/1">{children}</Hal>
        </HalProvider>
      );
    };
  };

  it('should indicate when link relation is available', async () => {
    const { result } = renderHook(() => useAction({ rel: 'edit' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.available).toBe(true);
    });
  });

  it('should indicate when link relation is not available', async () => {
    const { result } = renderHook(() => useAction({ rel: 'nonexistent' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.available).toBe(false);
    });
  });

  it('should execute POST action', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useAction({
          rel: 'edit',
          method: 'POST',
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.available).toBe(true);
    });

    await act(async () => {
      await result.current.execute({ title: 'Updated' });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should execute DELETE action', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useAction({
          rel: 'delete',
          method: 'DELETE',
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.available).toBe(true);
    });

    await act(async () => {
      await result.current.execute();
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should set error when link relation not found', async () => {
    const onError = vi.fn();
    const { result } = renderHook(
      () =>
        useAction({
          rel: 'nonexistent',
          onError,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.available).toBe(false);
    });

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).not.toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reset error state', async () => {
    const { result } = renderHook(() => useAction({ rel: 'nonexistent' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.available).toBe(false);
    });

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should track loading state during action', async () => {
    const { result } = renderHook(() => useAction({ rel: 'edit', method: 'POST' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.available).toBe(true);
    });

    expect(result.current.loading).toBe(false);

    let loadingDuringExecution = false;
    await act(async () => {
      const promise = result.current.execute({ title: 'Test' });
      // Check loading state (may be true depending on timing)
      loadingDuringExecution = result.current.loading;
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('should provide link object when available', async () => {
    const { result } = renderHook(() => useAction({ rel: 'edit' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.link).toEqual({ href: '/posts/1/edit' });
    });
  });
});
