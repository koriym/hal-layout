# hal-layout

A declarative React component library for rendering HAL (Hypertext Application Language) resources.

**[Live Demo](https://koriym.github.io/hal-layout/)** | **[Demo Source](./demo)** | **[API Reference](#api-reference)**

## Concept

**HAL structure directly maps to React component structure.**

```
HAL Response                    React Components
─────────────────────────────────────────────────────
resource                   →    <Hal>
  └── _embedded.author     →      <HalEmbedded rel="author">
  └── _embedded.comments   →      <HalEmbedded rel="comments">
  └── _links.edit          →      <HalLink rel="edit">
  └── _links.delete        →      <HalLink rel="delete">
```

No URL hardcoding. No manual `_embedded` / `_links` parsing. Just declare what to render.

## Installation

```bash
npm install hal-layout
```

## Quick Start

```tsx
import { HalProvider, Hal, HalEmbedded, HalLink, useHypermedia } from 'hal-layout';

function App() {
  return (
    <HalProvider baseUrl="https://api.example.com">
      <Hal uri="/posts/1">
        <PostDetail />
      </Hal>
    </HalProvider>
  );
}

function PostDetail() {
  const { data } = useHypermedia<Post>();

  return (
    <article>
      <h1>{data?.title}</h1>

      {/* Render embedded author */}
      <HalEmbedded rel="author">
        {({ data }) => <span>By {data.name}</span>}
      </HalEmbedded>

      {/* Render embedded comments */}
      <HalEmbedded rel="comments" renderItem={(comment) => (
        <Comment key={comment.id} {...comment} />
      )} />

      {/* Navigation link (GET → anchor) */}
      <HalLink rel="next">Next</HalLink>

      {/* Action button (DELETE → button) */}
      <HalLink rel="delete" method="DELETE">Delete</HalLink>
    </article>
  );
}
```

## Components

### `<Hal>` — Resource Scope

Fetches a HAL resource and provides context to children.

```tsx
<Hal uri="/posts/1" fallback={<Loading />}>
  <PostDetail />
</Hal>
```

### `<HalEmbedded>` — Render `_embedded`

Declaratively render embedded resources. No HTTP requests.

```tsx
{/* Single resource */}
<HalEmbedded rel="author">
  {({ data }) => <AuthorCard {...data} />}
</HalEmbedded>

{/* Collection */}
<HalEmbedded rel="comments" renderItem={(comment, index) => (
  <CommentCard key={comment.id} {...comment} />
)} />
```

### `<HalLink>` — Render `_links`

Declaratively render navigation links and action buttons.

**Element type is determined by HTTP method:**
- `GET` → `<a>` (anchor)
- `POST` / `PUT` / `DELETE` → `<button>`

```tsx
{/* Navigation (GET → anchor) */}
<HalLink rel="next">Next Page</HalLink>

{/* Delete action (DELETE → button) */}
<HalLink rel="delete" method="DELETE">Delete</HalLink>

{/* POST with body */}
<HalLink rel="approve" method="POST" body={{ status: 'approved' }}>
  Approve
</HalLink>

{/* URI template with params */}
<HalLink rel="search" params={{ q: 'hello', page: 2 }}>
  Search
</HalLink>
```

## URI Templates

Supports RFC 6570 URI templates:

```json
{
  "_links": {
    "search": { "href": "/posts{?q,page}", "templated": true }
  }
}
```

```tsx
<HalLink rel="search" params={{ q: 'hello', page: 2 }}>
  Search
</HalLink>
// → /posts?q=hello&page=2
```

Supported formats:
- Simple: `/posts/{id}` → `/posts/123`
- Query: `/posts{?q,page}` → `/posts?q=hello&page=2`
- Query continuation: `/posts?sort=date{&page}` → `/posts?sort=date&page=2`

## API Reference

### `<HalProvider>`

| Prop | Type | Description |
|------|------|-------------|
| `baseUrl` | `string` | Base URL for API |
| `client` | `Client` | Custom Ketting client |

### `<Hal>`

| Prop | Type | Description |
|------|------|-------------|
| `uri` | `string` | Resource URI |
| `fallback` | `ReactNode` | Loading state |
| `errorFallback` | `(error) => ReactNode` | Error state |
| `onLoad` | `(state) => void` | Load callback |
| `onError` | `(error) => void` | Error callback |

### `<HalEmbedded>`

| Prop | Type | Description |
|------|------|-------------|
| `rel` | `string` | Key in `_embedded` |
| `children` | `(props) => ReactNode` | Render single resource |
| `renderItem` | `(item, i) => ReactNode` | Render collection |
| `fallback` | `ReactNode` | When not found |

### `<HalLink>`

| Prop | Type | Description |
|------|------|-------------|
| `rel` | `string` | Key in `_links` |
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | HTTP method (default: `'GET'`) |
| `params` | `Record<string, string \| number>` | URI template parameters |
| `body` | `object` | Request body |
| `as` | `'button' \| 'a' \| 'span'` | Override element type |
| `onSuccess` | `(response) => void` | Success callback |
| `onError` | `(error) => void` | Error callback |

## Hooks

```tsx
// Access current resource context
const { data, loading, error, refresh } = useHypermedia<T>();

// Execute actions programmatically
const { execute, loading, href } = useAction({
  rel: 'search',
  method: 'GET',
  params: { q: 'hello' }
});
```

## HAL Response Example

```json
{
  "title": "My Post",
  "_links": {
    "self": { "href": "/posts/1" },
    "edit": { "href": "/posts/1" },
    "delete": { "href": "/posts/1" },
    "search": { "href": "/posts{?q}", "templated": true }
  },
  "_embedded": {
    "author": {
      "name": "John",
      "_links": { "self": { "href": "/users/1" } }
    },
    "comments": [
      { "text": "Great!", "_links": { "self": { "href": "/comments/1" } } }
    ]
  }
}
```

## License

MIT

## Related

- [HAL Specification](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal)
- [Ketting](https://github.com/badgateway/ketting) - Underlying HTTP client
