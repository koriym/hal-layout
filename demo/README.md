# hal-layout Demo

Interactive demo showing how hal-layout renders HAL resources.

## Run

```bash
cd demo
npm install
npm run dev
```

Open http://localhost:5173

## What it shows

- `<Hal>` - Fetches and provides HAL resource context
- `<HalEmbedded>` - Renders `_embedded` resources
- `<HalLink>` - Renders `_links` as navigation/actions
- URI template parameters

## Mock Data

The demo uses a mock HAL server (`mockServer.ts`) that simulates API responses.
