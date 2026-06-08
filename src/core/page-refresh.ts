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

export function hasPendingPageInteraction(): boolean {
  if (document.querySelector('[data-dashboard-tour-root]')) return true;
  const replyTextareas = document.querySelectorAll<HTMLTextAreaElement>('#ticket-reply textarea, #admin-ticket-reply textarea');
  if ([...replyTextareas].some((textarea) => textarea.value.trim().length > 0)) return true;
  return Boolean(document.querySelector('[data-file-list][data-has-files="true"]'));
}

function shouldPauseAutomaticRefresh(): boolean {
  if (document.hidden) return true;
  if (document.querySelector('dialog[open]')) return true;
  if (hasPendingPageInteraction()) return true;
  const active = document.activeElement;
  return active instanceof HTMLInputElement
    || active instanceof HTMLTextAreaElement
    || active instanceof HTMLSelectElement
    || (active instanceof HTMLElement && active.isContentEditable);
}

interface ViewStateSnapshot {
  windowX: number;
  windowY: number;
  scrollables: Array<{ key: string; top: number; left: number }>;
}

function scrollKey(element: HTMLElement, index: number): string {
  if (element.dataset.preserveScroll) return `data:${element.dataset.preserveScroll}`;
  if (element.id) return `id:${element.id}`;
  return `class:${element.className}:${index}`;
}

function captureViewState(): ViewStateSnapshot {
  const candidates = [...document.querySelectorAll<HTMLElement>('[data-preserve-scroll], .messages, .table-wrap')];
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    scrollables: candidates.map((element, index) => ({
      key: scrollKey(element, index),
      top: element.scrollTop,
      left: element.scrollLeft,
    })),
  };
}

function restoreViewState(snapshot: ViewStateSnapshot): void {
  const restore = (): void => {
    window.scrollTo(snapshot.windowX, snapshot.windowY);
    const candidates = [...document.querySelectorAll<HTMLElement>('[data-preserve-scroll], .messages, .table-wrap')];
    const byKey = new Map(candidates.map((element, index) => [scrollKey(element, index), element]));
    snapshot.scrollables.forEach((item) => {
      const element = byKey.get(item.key);
      if (!element) return;
      element.scrollTop = item.top;
      element.scrollLeft = item.left;
    });
  };
  requestAnimationFrame(() => requestAnimationFrame(restore));
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
    const viewState = background ? captureViewState() : undefined;
    backgroundRefresh = background;
    const request = Promise.resolve().then(task);
    this.inFlight = request;
    try {
      await request;
      if (viewState && generation === this.generation && currentLocationKey() === this.routeKey) restoreViewState(viewState);
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
