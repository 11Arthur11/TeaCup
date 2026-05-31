export type PageRefreshTask = () => void | Promise<void>;

export const PAGE_REFRESH_INTERVAL_MS = 5_000;
const PAUSED_RETRY_MS = 1_000;

let backgroundRefresh = false;

export function isBackgroundPageRefresh(): boolean {
  return backgroundRefresh;
}

function currentLocationKey(): string {
  return `${location.pathname}${location.search}`;
}

function shouldPauseAutomaticRefresh(): boolean {
  if (document.hidden) return true;
  if (document.querySelector('dialog[open]')) return true;
  const active = document.activeElement;
  return active instanceof HTMLInputElement
    || active instanceof HTMLTextAreaElement
    || active instanceof HTMLSelectElement
    || (active instanceof HTMLElement && active.isContentEditable);
}

class PageRefreshController {
  private generation = 0;
  private timer: number | undefined;
  private task: PageRefreshTask | undefined;
  private routeKey = '';
  private inFlight: Promise<void> | undefined;

  async start(routeKey: string, task: PageRefreshTask): Promise<void> {
    this.stop();
    this.routeKey = routeKey;
    this.task = task;
    const generation = this.generation;
    await this.run(generation, false);
  }

  stop(): void {
    this.generation += 1;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
    this.task = undefined;
    this.routeKey = '';
    this.inFlight = undefined;
  }

  async refreshNow(): Promise<void> {
    if (!this.task || this.inFlight) return;
    if (currentLocationKey() !== this.routeKey) return;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
    await this.run(this.generation, false);
  }

  private schedule(generation: number, delay = PAGE_REFRESH_INTERVAL_MS): void {
    if (generation !== this.generation || !this.task) return;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      void this.run(generation, true);
    }, delay);
  }

  private async run(generation: number, background: boolean): Promise<void> {
    if (generation !== this.generation || !this.task) return;
    if (currentLocationKey() !== this.routeKey) {
      this.stop();
      return;
    }
    if (background && shouldPauseAutomaticRefresh()) {
      this.schedule(generation, PAUSED_RETRY_MS);
      return;
    }
    if (this.inFlight) {
      this.schedule(generation, PAUSED_RETRY_MS);
      return;
    }

    const task = this.task;
    backgroundRefresh = background;
    const request = Promise.resolve().then(task);
    this.inFlight = request;
    try {
      await request;
    } finally {
      if (this.inFlight === request) this.inFlight = undefined;
      backgroundRefresh = false;
      if (generation === this.generation && currentLocationKey() === this.routeKey) {
        this.schedule(generation);
      }
    }
  }
}

export const pageRefresh = new PageRefreshController();
