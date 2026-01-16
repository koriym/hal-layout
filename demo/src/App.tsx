import { useState } from 'react';
import { HalProvider, Hal, HalEmbedded, HalLink, useHypermedia } from 'hal-layout';
import { createMockClient } from './mockServer';

// Create mock client with HAL responses
const mockClient = createMockClient();

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <HalProvider baseUrl="http://localhost:3000" client={mockClient as any}>
      <h1>hal-layout Demo</h1>

      <h2>HAL Response (Mock)</h2>
      <HalJsonPreview />

      <h2>Rendered UI</h2>

      {/* Search with URI template */}
      <div className="search-form">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <HalLink rel="search" params={{ q: searchQuery }}>
          Search
        </HalLink>
      </div>

      <Hal uri="/posts/1" fallback={<div className="loading">Loading...</div>}>
        <PostDetail />
      </Hal>
    </HalProvider>
  );
}

function HalJsonPreview() {
  const halResponse = {
    "title": "Introduction to HAL",
    "body": "HAL (Hypertext Application Language) is a simple format...",
    "_links": {
      "self": { "href": "/posts/1" },
      "edit": { "href": "/posts/1" },
      "delete": { "href": "/posts/1" },
      "search": { "href": "/posts{?q}", "templated": true }
    },
    "_embedded": {
      "author": {
        "name": "John Doe",
        "email": "john@example.com",
        "_links": { "self": { "href": "/users/1" } }
      },
      "comments": [
        { "id": 1, "text": "Great article!", "author": "Alice", "_links": { "self": { "href": "/comments/1" } } },
        { "id": 2, "text": "Very helpful, thanks!", "author": "Bob", "_links": { "self": { "href": "/comments/2" } } }
      ]
    }
  };

  return (
    <pre className="hal-json">
      {JSON.stringify(halResponse, null, 2)}
    </pre>
  );
}

interface Post {
  title: string;
  body: string;
}

interface Author {
  name: string;
  email: string;
}

interface Comment {
  id: number;
  text: string;
  author: string;
}

function PostDetail() {
  const { data, loading, error } = useHypermedia<Post>();

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="card">
      <h1>{data.title}</h1>

      {/* Render _embedded.author */}
      <HalEmbedded<Author> rel="author">
        {({ data: author }) => (
          <div className="author">
            By {author.name} ({author.email})
          </div>
        )}
      </HalEmbedded>

      <p>{data.body}</p>

      {/* Action links from _links */}
      <div className="actions">
        {/* GET → renders as <a> */}
        <HalLink rel="edit">Edit Post</HalLink>

        {/* DELETE → renders as <button> */}
        <HalLink
          rel="delete"
          method="DELETE"
          onSuccess={() => alert('Post deleted!')}
        >
          Delete Post
        </HalLink>
      </div>

      {/* Render _embedded.comments */}
      <div className="comments">
        <h3>Comments</h3>
        <HalEmbedded<Comment>
          rel="comments"
          renderItem={(comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-author">{comment.author}</div>
              <div>{comment.text}</div>
            </div>
          )}
          fallback={<p>No comments yet.</p>}
        />
      </div>
    </div>
  );
}

export default App;
