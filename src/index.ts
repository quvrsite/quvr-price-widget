import { QuiverClient, QuiverApiError } from "@quiver/sdk";

export interface QuiverWidgetOptions {
  /** DOM element or CSS selector to mount into. */
  target: string | HTMLElement;
  /** Base URL of the Quiver app whose public API to read from. */
  baseUrl: string;
  /** Which widget to render. */
  mode: "ticker" | "watchlist";
  /** Token symbols to display, e.g. ["TSLA", "NVDA", "USDG"]. */
  symbols: string[];
  /**
   * Refresh interval in ms. Default 30_000. Clamped to a 20_000 (20s) minimum
   * — this matches the SDK's default cache TTL, so setting it lower just
   * wastes cycles re-reading the same cached value, it will NOT make the
   * widget hit the backend more often than the cache allows.
   */
  refreshMs?: number;
  /** Light or dark theme. Default "dark". */
  theme?: "light" | "dark";
}

const STYLE_ID = "quiver-widget-style";
const MIN_REFRESH_MS = 20_000;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .qv-widget { font-family: ui-sans-serif, system-ui, sans-serif; border-radius: 12px; padding: 12px; }
    .qv-widget.qv-dark { background: #0b0d12; color: #e6e8eb; border: 1px solid #1f232b; }
    .qv-widget.qv-light { background: #ffffff; color: #0b0d12; border: 1px solid #e5e7eb; }
    .qv-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 4px; font-size: 13px; }
    .qv-symbol { font-weight: 600; }
    .qv-price { font-variant-numeric: tabular-nums; opacity: 0.9; }
    .qv-footer { margin-top: 8px; font-size: 11px; opacity: 0.5; text-align: right; }
    .qv-footer a { color: inherit; }
    .qv-loading, .qv-error { opacity: 0.6; font-size: 12px; padding: 8px 4px; }
  `;
  document.head.appendChild(style);
}

export class QuiverWidgetInstance {
  private opts: Required<QuiverWidgetOptions>;
  private el: HTMLElement;
  private timer?: ReturnType<typeof setInterval>;
  private client: QuiverClient;

  constructor(opts: QuiverWidgetOptions) {
    const target =
      typeof opts.target === "string" ? document.querySelector<HTMLElement>(opts.target) : opts.target;
    if (!target) throw new Error(`QuiverWidget: target "${opts.target}" not found`);
    this.el = target;
    this.opts = {
      refreshMs: Math.max(MIN_REFRESH_MS, opts.refreshMs ?? 30_000),
      theme: opts.theme ?? "dark",
      ...opts,
    };
    // One shared client per widget instance -> the SDK's built-in cache
    // actually does its job instead of being reset every poll.
    this.client = new QuiverClient({ baseUrl: this.opts.baseUrl, cacheTtlMs: this.opts.refreshMs });
    injectStyles();
    this.el.classList.add("qv-widget", this.opts.theme === "light" ? "qv-light" : "qv-dark");
    this.render([]);
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), this.opts.refreshMs);
  }

  private async refresh() {
    try {
      const rows = [];
      for (const symbol of this.opts.symbols) {
        const matches = await this.client.getTokens(symbol);
        const match = matches.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
        if (match) rows.push(match);
      }
      this.render(rows);
    } catch (err) {
      if (err instanceof QuiverApiError && err.status === 429) {
        // The SDK already retried with backoff and still got rate-limited —
        // back off this widget instance too instead of hammering harder.
        console.warn("[QuiverWidget] rate-limited, will retry next cycle");
        return;
      }
      console.error("[QuiverWidget] refresh failed:", err);
      this.el.innerHTML = `<div class="qv-error">Quiver data unavailable</div>`;
    }
  }

  private render(rows: { symbol: string; name: string; cached_price_usd: number | string | null }[]) {
    if (!rows.length) {
      this.el.innerHTML = `<div class="qv-loading">Loading Quiver data…</div>`;
      return;
    }
    const rowsHtml = rows
      .map((r) => {
        const price = r.cached_price_usd != null ? `$${Number(r.cached_price_usd).toFixed(2)}` : "—";
        return `<div class="qv-row"><span class="qv-symbol">${r.symbol}</span><span class="qv-price">${price}</span></div>`;
      })
      .join("");
    this.el.innerHTML = `${rowsHtml}<div class="qv-footer">Powered by <a href="${this.opts.baseUrl}" target="_blank" rel="noopener">Quiver</a></div>`;
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

export function mount(opts: QuiverWidgetOptions): QuiverWidgetInstance {
  return new QuiverWidgetInstance(opts);
}

export default { mount };
