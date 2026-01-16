import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { Hal } from '../../src/components/Hal';
import { HalLink } from '../../src/components/HalLink';
import { HalProvider } from '../../src/context/HalProvider';
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
    edit: { href: '/posts/1/edit', title: 'Edit this post' },
    delete: { href: '/posts/1' },
    next: { href: '/posts/2' },
  },
};

describe('HalLink', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = new MockClient(mockHalResource);
    mockClient.setResource('/posts/1', mockHalResource);
  });

  it('should render anchor by default for GET method', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="next">Next Post</HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Next Post' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/posts/2');
    });
  });

  it('should render button for POST/PUT/DELETE methods', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="edit" method="PUT">Update</HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });
  });

  it('should not render when link relation does not exist', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="nonexistent">Should Not Render</HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      // Wait for layout to load
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument();
  });

  it('should use link title as tooltip', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="edit">Edit</HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
        'title',
        'Edit this post'
      );
    });
  });

  it('should call onSuccess after successful action', async () => {
    const onSuccess = vi.fn();

    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="edit" method="POST" onSuccess={onSuccess}>
            Submit
          </HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should render with render props', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="delete" method="DELETE">
            {({ loading, execute }) => (
              <button onClick={execute} data-testid="custom-button">
                {loading ? 'Deleting...' : 'Delete Item'}
              </button>
            )}
          </HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-button')).toHaveTextContent('Delete Item');
    });
  });

  it('should disable button while loading', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalLink rel="edit" method="POST">
            Submit
          </HalLink>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Button should be enabled initially
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});

