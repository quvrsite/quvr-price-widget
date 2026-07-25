# @quiver/widget

Embeddable price ticker / mini-watchlist widget for Quiver. Any site can drop this
in with a single `<script>` tag and show live Stock Token / USDG prices, linking
back to [quvr.site](https://quvr.site).

> ⚠️ This widget calls Quiver's **public** `/api/tokens` endpoint via `@quiver/sdk`.
> It doesn't handle authentication and shouldn't be used to display user-specific
> (watchlist/portfolio) data — those require a signed-in session on the Quiver app
> itself.

## Safe by default

- Built on `@quiver/sdk`, so every poll goes through the SDK's in-memory cache and
  429 backoff — see that package's README for details.
- `refreshMs` is clamped to a **20s minimum**, matching the SDK's default cache TTL.
  Setting it lower doesn't make the widget poll the backend faster, it just re-reads
  the same cached value more often.
- On a 429, the widget backs off silently for that cycle instead of retrying harder.

## Usage (script tag)

```html
<div id="qv-ticker"></div>
<script src="https://cdn.jsdelivr.net/npm/@quiver/widget/dist/quiver-widget.global.js"></script>
<script>
  QuiverWidget.mount({
    target: "#qv-ticker",
    baseUrl: "https://quvr.site",
    mode: "ticker",
    symbols: ["TSLA", "NVDA", "USDG"],
    theme: "dark",
  });
</script>
```

## Usage (npm / bundler)

```bash
npm install @quiver/widget
```

```ts
import { mount } from "@quiver/widget";

mount({
  target: document.getElementById("qv-ticker")!,
  baseUrl: "https://quvr.site",
  mode: "ticker",
  symbols: ["TSLA", "NVDA"],
});
```

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `target` | `string \| HTMLElement` | required | CSS selector or element to mount into |
| `baseUrl` | `string` | required | Quiver app base URL |
| `mode` | `"ticker" \| "watchlist"` | required | `watchlist` mode is a placeholder for now — contributions welcome |
| `symbols` | `string[]` | required | Token symbols to display |
| `refreshMs` | `number` | `30000` | Clamped to a 5s minimum to avoid hammering the API |
| `theme` | `"light" \| "dark"` | `"dark"` | |

## Development

```bash
npm install
npm run dev     # watch build to dist/
open examples/index.html
```

## Rate limiting note

This widget polls Quiver's public API from every visitor's browser — each visitor's
own cache is independent, so on a high-traffic site you still get one request per
visitor per `refreshMs` window at minimum. The SDK's cache prevents a single page
from over-polling; it can't reduce cross-visitor volume. For very high-traffic
embeds, consider fronting `/api/tokens` with your own edge cache, or ask the Quiver
team about a CDN-cached read replica of this endpoint.

## License

MIT
