export interface RouteContext { path: string; params: Record<string, string>; query: URLSearchParams; }
export type RouteHandler = (context: RouteContext) => void | Promise<void>;
interface Route { pattern: string; regex: RegExp; keys: string[]; handler: RouteHandler; }

class Router {
  private routes: Route[] = [];
  private fallback: RouteHandler = () => undefined;
  private beforeResolve: (() => void | Promise<void>) | undefined;
  private afterResolve: (() => void | Promise<void>) | undefined;
  private resolving: Promise<void> | undefined;
  private pendingHref: string | undefined;

  register(pattern: string, handler: RouteHandler): this {
    const keys: string[] = [];
    const regexSource = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([A-Za-z0-9_]+)/g, (_m, key: string) => {
      keys.push(key); return '([^/]+)';
    });
    this.routes.push({ pattern, regex: new RegExp(`^${regexSource}/?$`), keys, handler });
    return this;
  }

  setFallback(handler: RouteHandler): this { this.fallback = handler; return this; }
  setBeforeResolve(handler: () => void | Promise<void>): this { this.beforeResolve = handler; return this; }
  setAfterResolve(handler: () => void | Promise<void>): this { this.afterResolve = handler; return this; }

  navigate(path: string, replace = false): void {
    if (replace) history.replaceState({}, '', path); else history.pushState({}, '', path);
    void this.resolve();
  }

  async resolve(): Promise<void> {
    const requestedHref = `${location.pathname}${location.search}`;
    if (this.resolving) {
      this.pendingHref = requestedHref;
      await this.resolving;
      return;
    }

    const run = async (): Promise<void> => {
      let href = requestedHref;
      do {
        this.pendingHref = undefined;
        await this.beforeResolve?.();
        const url = new URL(href, location.origin);
        const path = url.pathname;
        try {
          let matched = false;
          for (const route of this.routes) {
            const match = path.match(route.regex);
            if (!match) continue;
            matched = true;
            const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1] ?? '')]));
            await route.handler({ path, params, query: url.searchParams });
            window.scrollTo({ top: 0, behavior: 'instant' });
            break;
          }
          if (!matched) await this.fallback({ path, params: {}, query: url.searchParams });
        } finally {
          await this.afterResolve?.();
        }

        const pending = this.pendingHref;
        if (!pending || pending === href) break;
        href = pending;
      } while (true);
    };

    this.resolving = run();
    try { await this.resolving; }
    finally { this.resolving = undefined; }
  }

  start(): void {
    document.addEventListener('click', (event) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-link]');
      if (!anchor || event.button !== 0 || anchor.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(anchor.href, location.origin);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (destination === current) return;
      this.navigate(destination);
    });
    window.addEventListener('popstate', () => void this.resolve());
    void this.resolve();
  }
}

export const router = new Router();
