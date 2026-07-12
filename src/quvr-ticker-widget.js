/**
 * <quvr-ticker> — a zero-dependency web component that polls the public
 * QUVR ticker API (https://quvr.site/api/ticker) and renders a compact
 * live price strip for stock tokens & USDG on Robinhood Chain.
 *
 * Usage:
 *   <script type="module" src="https://cdn.jsdelivr.net/gh/quvrsite/quvr-price-widget/src/quvr-ticker-widget.js"></script>
 *   <quvr-ticker interval="15000"></quvr-ticker>
 *
 * Attributes:
 *   base-url  - QUVR API base URL (default: https://quvr.site)
 *   interval  - Poll interval in ms (default: 15000)
 *   symbols   - Comma-separated symbol filter, e.g. "TSLA,NVDA" (default: all)
 *   theme     - "light" | "dark" (default: dark)
 */

const DEFAULT_BASE_URL = "https://quvr.site";
const DEFAULT_INTERVAL_MS = 15000;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      --quvr-bg: #0b0d12;
      --quvr-fg: #e6e8ee;
      --quvr-muted: #8b91a1;
      --quvr-up: #22c55e;
      --quvr-down: #ef4444;
      --quvr-border: #1f2330;
    }
    :host([theme="light"]) {
      --quvr-bg: #ffffff;
      --quvr-fg: #111318;
      --quvr-muted: #6b7280;
      --quvr-border: #e5e7eb;
    }
    .wrap {
      display: flex;
      align-items: center;
      gap: 20px;
      overflow-x: auto;
      background: var(--quvr-bg);
      color: var(--quvr-fg);
      border: 1px solid var(--quvr-border);
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 13px;
      scrollbar-width: none;
    }
    .wrap::-webkit-scrollbar { display: none; }
    .item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      white-space: nowrap;
    }
    .sym { font-weight: 700; letter-spacing: 0.02em; }
    .price { font-variant-numeric: tabular-nums; }
    .chg { font-variant-numeric: tabular-nums; }
    .up { color: var(--quvr-up); }
    .down { color: var(--quvr-down); }
    .flat { color: var(--quvr-muted); }
    .badge {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--quvr-fg) 12%, transparent);
      color: var(--quvr-muted);
    }
    .footer {
      margin-left: auto;
      color: var(--quvr-muted);
      font-size: 11px;
      flex-shrink: 0;
    }
    .footer a { color: inherit; }
    .error { color: var(--quvr-down); font-size: 12px; }
  </style>
  <div class="wrap" part="wrap"><div class="error" style="display:none"></div></div>
`;

class QuvrTicker extends HTMLElement {
  static get observedAttributes() {
    return ["base-url", "interval", "symbols", "theme"];
  }

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.appendChild(TEMPLATE.content.cloneNode(true));
    this._wrap = this._root.querySelector(".wrap");
    this._timer = null;
  }

  connectedCallback() {
    this._fetchAndRender();
    this._startPolling();
  }

  disconnectedCallback() {
    this._stopPolling();
  }

  attributeChangedCallback() {
    if (!this.isConnected) return;
    this._stopPolling();
    this._fetchAndRender();
    this._startPolling();
  }

  get baseUrl() {
    return this.getAttribute("base-url") || DEFAULT_BASE_URL;
  }

  get intervalMs() {
    const raw = Number(this.getAttribute("interval"));
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL_MS;
  }

  get symbolFilter() {
    const raw = this.getAttribute("symbols");
    if (!raw) return null;
    return raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  }

  _startPolling() {
    this._timer = setInterval(() => this._fetchAndRender(), this.intervalMs);
  }

  _stopPolling() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  async _fetchAndRender() {
    try {
      const res = await fetch(`${this.baseUrl}/api/ticker`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this._render(data.prices || []);
    } catch (err) {
      this._renderError(err);
    }
  }

  _render(prices) {
    const filter = this.symbolFilter;
    const rows = filter
      ? prices.filter((p) => filter.includes(p.symbol.toUpperCase()))
      : prices;

    const itemsHtml = rows
      .map((p) => {
        const tone = p.tone === "up" ? "up" : p.tone === "down" ? "down" : "flat";
        const sign = p.changePct24h == null ? "" : p.changePct24h > 0 ? "+" : "";
        const chg =
          p.changePct24h == null ? "—" : `${sign}${p.changePct24h.toFixed(2)}%`;
        const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : "";
        return `
          <div class="item">
            <span class="sym">${escapeHtml(p.symbol)}</span>
            <span class="price">$${escapeHtml(String(p.priceUsd))}</span>
            <span class="chg ${tone}">${chg}</span>
            ${badge}
          </div>`;
      })
      .join("");

    this._wrap.innerHTML = `
      ${itemsHtml || '<div class="error">No price data.</div>'}
      <div class="footer">via <a href="https://quvr.site" target="_blank" rel="noopener">QUVR</a></div>
    `;
  }

  _renderError(err) {
    this._wrap.innerHTML = `<div class="error">QUVR ticker unavailable (${escapeHtml(
      err.message || String(err),
    )})</div>`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (!customElements.get("quvr-ticker")) {
  customElements.define("quvr-ticker", QuvrTicker);
}

export { QuvrTicker };
