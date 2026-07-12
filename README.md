# quvr-price-widget

A dependency-free `<quvr-ticker>` web component that shows a live price strip for stock tokens & USDG from [QUVR](https://quvr.site) — a bridge aggregator and watchlist for **Robinhood Chain**. Drop it into any website, no build step required.

- Website: https://quvr.site
- Twitter/X: https://x.com/QUVRsite
- Org: https://github.com/quvrsite

## Preview

```
TSLA  $248.31  ▲ +1.42%     NVDA  $132.90  ▼ -0.55%     SPY  $612.04  0.03%     USDG  $1.00  0.00%
                                                                            via QUVR
```

## Usage

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/quvrsite/quvr-price-widget/src/quvr-ticker-widget.js"></script>

<quvr-ticker></quvr-ticker>
```

### Attributes

| Attribute  | Default                 | Description                                       |
|------------|--------------------------|-----------------------------------------------------|
| `base-url` | `https://quvr.site`      | Point at a different QUVR deployment                |
| `interval` | `15000`                  | Poll interval in milliseconds                        |
| `symbols`  | (all)                    | Comma-separated filter, e.g. `symbols="TSLA,NVDA"`   |
| `theme`    | `dark`                   | `dark` or `light`                                     |

### React / Vue / any framework

Since it's a standard custom element, it works anywhere:

```jsx
function Ticker() {
  return <quvr-ticker interval="10000" theme="light" />;
}
```

### Styling

The component renders inside a shadow DOM but exposes a `wrap` CSS part and CSS custom properties for easy theming:

```css
quvr-ticker {
  --quvr-bg: #0b0d12;
  --quvr-fg: #e6e8ee;
  --quvr-up: #22c55e;
  --quvr-down: #ef4444;
}
```

## Local demo

```bash
git clone https://github.com/quvrsite/quvr-price-widget
cd quvr-price-widget
npx serve .
# open demo/index.html
```

## Disclaimer

This is an unofficial, community-built widget based on QUVR's publicly observable `/api/ticker` response shape. It may need updates if that shape changes.

## License

MIT
