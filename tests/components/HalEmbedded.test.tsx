import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Hal } from '../../src/components/Hal';
import { HalEmbedded } from '../../src/components/HalEmbedded';
import { HalProvider } from '../../src/context/HalProvider';
import { MockClient } from '../mocks/ketting';
import type { HalResource } from '../../src/types/hal';

// Mock ketting module
vi.mock('ketting', () => ({
  Client: vi.fn(),
}));

interface Author {
  name: string;
  email: string;
}

interface Comment {
  id: string;
  text: string;
}

const mockHalResource: HalResource = {
  title: 'Test Post',
  _links: {
    self: { href: '/posts/1' },
  },
  _embedded: {
    author: {
      name: 'John Doe',
      email: 'john@example.com',
      _links: { self: { href: '/authors/1' } },
    },
    comments: [
      { id: '1', text: 'First comment', _links: { self: { href: '/comments/1' } } },
      { id: '2', text: 'Second comment', _links: { self: { href: '/comments/2' } } },
      { id: '3', text: 'Third comment', _links: { self: { href: '/comments/3' } } },
    ],
  },
};

describe('HalEmbedded', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = new MockClient(mockHalResource);
    mockClient.setResource('/posts/1', mockHalResource);
  });

  it('should render single embedded resource with children function', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalEmbedded<Author> rel="author">
            {({ data }) => (
              <div>
                <span data-testid="author-name">{data.name}</span>
                <span data-testid="author-email">{data.email}</span>
              </div>
            )}
          </HalEmbedded>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('author-name')).toHaveTextContent('John Doe');
    });
    expect(screen.getByTestId('author-email')).toHaveTextContent('john@example.com');
  });

  it('should render collection with renderItem', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalEmbedded<Comment>
            rel="comments"
            renderItem={(comment) => (
              <div key={comment.id} data-testid={`comment-${comment.id}`}>
                {comment.text}
              </div>
            )}
          />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('comment-1')).toHaveTextContent('First comment');
    });
    expect(screen.getByTestId('comment-2')).toHaveTextContent('Second comment');
    expect(screen.getByTestId('comment-3')).toHaveTextContent('Third comment');
  });

  it('should render fallback when embedded resource not found', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalEmbedded rel="nonexistent" fallback={<div data-testid="fallback">No data</div>}>
            {() => <div>Should not render</div>}
          </HalEmbedded>
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveTextContent('No data');
    });
  });

  it('should provide index in renderItem callback', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalEmbedded<Comment>
            rel="comments"
            renderItem={(comment, index) => (
              <div key={comment.id} data-testid={`comment-index-${index}`}>
                {index}: {comment.text}
              </div>
            )}
          />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('comment-index-0')).toHaveTextContent('0: First comment');
    });
    expect(screen.getByTestId('comment-index-1')).toHaveTextContent('1: Second comment');
    expect(screen.getByTestId('comment-index-2')).toHaveTextContent('2: Third comment');
  });

  it('should use keyExtractor for list keys', async () => {
    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalEmbedded<Comment>
            rel="comments"
            keyExtractor={(comment) => `key-${comment.id}`}
            renderItem={(comment) => <div data-testid={`comment-${comment.id}`}>{comment.text}</div>}
          />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('comment-1')).toBeInTheDocument();
    });
  });

  it('should wrap collection items with custom wrapper', async () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ul data-testid="comment-list">{children}</ul>
    );

    render(
      <HalProvider baseUrl="http://test.com" client={mockClient as never}>
        <Hal uri="/posts/1">
          <HalEmbedded<Comment>
            rel="comments"
            wrapper={Wrapper}
            renderItem={(comment) => <li key={comment.id}>{comment.text}</li>}
          />
        </Hal>
      </HalProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('comment-list')).toBeInTheDocument();
    });
    expect(screen.getByTestId('comment-list').tagName).toBe('UL');
  });
});
