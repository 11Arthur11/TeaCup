import { escapeHtml, icon } from '../core/dom.js';
import { router } from '../core/router.js';
import { store } from '../core/store.js';
import { notify } from '../core/toast.js';

const CONFIG_URL = '/content/dashboard-tour.json';
const DEFAULT_REGISTRATION_KEY = 'teacloud-dashboard-tour-registration-pending';
const DEFAULT_MANUAL_KEY = 'teacloud-dashboard-tour-manual-pending';
const DEFAULT_COMPLETED_KEY = 'teacloud-dashboard-tour-completed-v1';

type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';
type TourContext = 'workspace' | 'sidebar';

interface SelectorTarget {
  type: 'selector';
  selector: string;
  mobileSelector?: string;
  context?: TourContext;
  mobileContext?: TourContext;
}

interface SidebarTarget {
  type: 'sidebar-index';
  index: number;
}

interface CenterTarget { type: 'center'; }
type TourTarget = SelectorTarget | SidebarTarget | CenterTarget;

interface TourStep {
  id: string;
  target: TourTarget;
  placement?: TourPlacement;
  icon?: string;
  title: string;
  text: string;
}

interface TourConfig {
  version: number;
  enabled: boolean;
  autoStartAfterRegister: boolean;
  storage: {
    registrationPendingKey: string;
    manualPendingKey: string;
    completedKey: string;
  };
  ui: {
    guideLabel: string;
    guideTitle: string;
    counterTemplate: string;
    previousLabel: string;
    nextLabel: string;
    finishLabel: string;
    cancelLabel: string;
    closeAriaLabel: string;
    loadingError: string;
  };
  settings: {
    spotlightPadding: number;
    cardGap: number;
    mobileBreakpoint: number;
    scrollBehavior: ScrollBehavior;
  };
  steps: TourStep[];
}

interface ActiveTour {
  config: TourConfig;
  root: HTMLElement;
  card: HTMLElement;
  spotlight: HTMLElement;
  pointer: HTMLElement;
  controller: AbortController;
  stepIndex: number;
  target?: HTMLElement;
  initialSidebarOpen: boolean;
  resizeObserver?: ResizeObserver;
}

let configPromise: Promise<TourConfig> | undefined;
let activeTour: ActiveTour | undefined;
let autoStartScheduled = false;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalizeTarget(value: unknown): TourTarget | undefined {
  const target = asRecord(value);
  if (target.type === 'center') return { type: 'center' };
  if (target.type === 'sidebar-index') {
    const index = Number(target.index);
    return Number.isInteger(index) && index > 0 ? { type: 'sidebar-index', index } : undefined;
  }
  if (target.type === 'selector' && typeof target.selector === 'string' && target.selector.trim()) {
    const context = target.context === 'sidebar' || target.context === 'workspace' ? target.context : undefined;
    const mobileContext = target.mobileContext === 'sidebar' || target.mobileContext === 'workspace' ? target.mobileContext : undefined;
    return {
      type: 'selector',
      selector: target.selector.trim(),
      mobileSelector: typeof target.mobileSelector === 'string' && target.mobileSelector.trim() ? target.mobileSelector.trim() : undefined,
      context,
      mobileContext,
    };
  }
  return undefined;
}

function normalizeConfig(value: unknown): TourConfig {
  const root = asRecord(value);
  const storage = asRecord(root.storage);
  const ui = asRecord(root.ui);
  const settings = asRecord(root.settings);
  const rawSteps = Array.isArray(root.steps) ? root.steps : [];
  const placements = new Set<TourPlacement>(['auto', 'top', 'bottom', 'left', 'right', 'center']);
  const steps = rawSteps.flatMap((raw, index): TourStep[] => {
    const step = asRecord(raw);
    const target = normalizeTarget(step.target);
    if (!target || typeof step.title !== 'string' || typeof step.text !== 'string') return [];
    const placement = placements.has(step.placement as TourPlacement) ? step.placement as TourPlacement : 'auto';
    return [{
      id: stringValue(step.id, `step-${index + 1}`),
      target,
      placement,
      icon: typeof step.icon === 'string' ? step.icon : undefined,
      title: step.title.trim(),
      text: step.text.trim(),
    }];
  });

  if (!steps.length) throw new Error('Dashboard tour has no valid steps.');
  return {
    version: numberValue(root.version, 1, 1, 999),
    enabled: root.enabled !== false,
    autoStartAfterRegister: root.autoStartAfterRegister !== false,
    storage: {
      registrationPendingKey: stringValue(storage.registrationPendingKey, DEFAULT_REGISTRATION_KEY),
      manualPendingKey: stringValue(storage.manualPendingKey, DEFAULT_MANUAL_KEY),
      completedKey: stringValue(storage.completedKey, DEFAULT_COMPLETED_KEY),
    },
    ui: {
      guideLabel: stringValue(ui.guideLabel, 'راهنما'),
      guideTitle: stringValue(ui.guideTitle, 'شروع راهنمای داشبورد'),
      counterTemplate: stringValue(ui.counterTemplate, 'مرحله {current} از {total}'),
      previousLabel: stringValue(ui.previousLabel, 'مرحله قبل'),
      nextLabel: stringValue(ui.nextLabel, 'مرحله بعد'),
      finishLabel: stringValue(ui.finishLabel, 'پایان'),
      cancelLabel: stringValue(ui.cancelLabel, 'انصراف'),
      closeAriaLabel: stringValue(ui.closeAriaLabel, 'بستن راهنما'),
      loadingError: stringValue(ui.loadingError, 'تنظیمات راهنما دریافت نشد.'),
    },
    settings: {
      spotlightPadding: numberValue(settings.spotlightPadding, 9, 0, 30),
      cardGap: numberValue(settings.cardGap, 16, 8, 40),
      mobileBreakpoint: numberValue(settings.mobileBreakpoint, 820, 480, 1200),
      scrollBehavior: settings.scrollBehavior === 'smooth' ? 'smooth' : 'auto',
    },
    steps,
  };
}

async function loadConfig(force = false): Promise<TourConfig> {
  if (force) configPromise = undefined;
  configPromise ??= fetch(CONFIG_URL, { cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Dashboard tour config request failed: ${response.status}`);
      return normalizeConfig(await response.json());
    })
    .catch((error) => {
      configPromise = undefined;
      throw error;
    });
  return configPromise;
}

function storageRead(storage: Storage, key: string): boolean {
  try { return storage.getItem(key) === '1'; } catch { return false; }
}

function storageWrite(storage: Storage, key: string, value: string): void {
  try { storage.setItem(key, value); } catch { /* Tour remains usable when storage is blocked. */ }
}

function storageRemove(storage: Storage, key: string): void {
  try { storage.removeItem(key); } catch { /* Ignore restricted storage. */ }
}

export async function markDashboardTourPendingAfterRegistration(): Promise<void> {
  try {
    const config = await loadConfig();
    if (!config.enabled || !config.autoStartAfterRegister) return;
    storageWrite(localStorage, config.storage.registrationPendingKey, '1');
  } catch {
    storageWrite(localStorage, DEFAULT_REGISTRATION_KEY, '1');
  }
}

function isMobile(config: TourConfig): boolean {
  return window.innerWidth <= config.settings.mobileBreakpoint;
}

function setMobileSidebar(open: boolean): void {
  if (!document.querySelector('.app-shell')) return;
  store.set({ sidebarOpen: open });
  document.querySelector('.app-shell')?.classList.toggle('app-shell--sidebar-open', open);
}

function isVisible(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

function stepContext(step: TourStep, config: TourConfig): TourContext {
  if (step.target.type === 'sidebar-index') return 'sidebar';
  if (step.target.type === 'selector') {
    if (isMobile(config) && step.target.mobileContext) return step.target.mobileContext;
    return step.target.context ?? 'workspace';
  }
  return 'workspace';
}

function resolveTarget(step: TourStep, config: TourConfig): HTMLElement | undefined {
  if (step.target.type === 'center') return undefined;
  if (step.target.type === 'sidebar-index') {
    return document.querySelector<HTMLElement>(`[data-tour-menu-index="${step.target.index}"]`) ?? undefined;
  }
  const selector = isMobile(config) && step.target.mobileSelector ? step.target.mobileSelector : step.target.selector;
  const candidates = [...document.querySelectorAll<HTMLElement>(selector)];
  return candidates.find(isVisible) ?? candidates[0];
}

function counterText(config: TourConfig, current: number): string {
  return config.ui.counterTemplate
    .replace('{current}', String(current + 1))
    .replace('{total}', String(config.steps.length));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function selectedPlacement(tour: ActiveTour, rect: DOMRect): Exclude<TourPlacement, 'auto'> {
  const requested = tour.config.steps[tour.stepIndex]?.placement ?? 'auto';
  if (requested !== 'auto') return requested;
  const cardWidth = tour.card.offsetWidth || 380;
  const cardHeight = tour.card.offsetHeight || 250;
  const gap = tour.config.settings.cardGap;
  if (window.innerWidth - rect.right > cardWidth + gap) return 'right';
  if (rect.left > cardWidth + gap) return 'left';
  if (window.innerHeight - rect.bottom > cardHeight + gap) return 'bottom';
  return 'top';
}

function positionTour(tour: ActiveTour): void {
  const step = tour.config.steps[tour.stepIndex];
  if (!step) return;
  const mobile = isMobile(tour.config);
  if (!tour.target || step.target.type === 'center') {
    tour.root.classList.add('dashboard-tour--center');
    tour.card.removeAttribute('style');
    tour.spotlight.hidden = true;
    tour.pointer.hidden = true;
    return;
  }

  tour.root.classList.remove('dashboard-tour--center');
  tour.spotlight.hidden = false;
  const rect = tour.target.getBoundingClientRect();
  const padding = tour.config.settings.spotlightPadding;
  const left = clamp(rect.left - padding, 6, window.innerWidth - 12);
  const top = clamp(rect.top - padding, 6, window.innerHeight - 12);
  const width = clamp(rect.width + padding * 2, 24, window.innerWidth - left - 6);
  const height = clamp(rect.height + padding * 2, 24, window.innerHeight - top - 6);
  Object.assign(tour.spotlight.style, {
    left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
  });

  const cardWidth = tour.card.offsetWidth || Math.min(390, window.innerWidth - 24);
  const cardHeight = tour.card.offsetHeight || 250;
  const gap = tour.config.settings.cardGap;
  const placement = selectedPlacement(tour, rect);
  let cardLeft = 12;
  let cardTop = 12;

  if (mobile) {
    cardLeft = 12;
    cardTop = Math.max(12, window.innerHeight - cardHeight - 12);
  } else if (placement === 'left') {
    cardLeft = rect.left - cardWidth - gap;
    cardTop = rect.top + rect.height / 2 - cardHeight / 2;
  } else if (placement === 'right') {
    cardLeft = rect.right + gap;
    cardTop = rect.top + rect.height / 2 - cardHeight / 2;
  } else if (placement === 'top') {
    cardLeft = rect.left + rect.width / 2 - cardWidth / 2;
    cardTop = rect.top - cardHeight - gap;
  } else {
    cardLeft = rect.left + rect.width / 2 - cardWidth / 2;
    cardTop = rect.bottom + gap;
  }

  cardLeft = clamp(cardLeft, 12, window.innerWidth - cardWidth - 12);
  cardTop = clamp(cardTop, 12, window.innerHeight - cardHeight - 12);
  Object.assign(tour.card.style, { left: `${cardLeft}px`, top: `${cardTop}px` });

  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;
  tour.pointer.hidden = false;
  let pointerX = targetCenterX;
  let pointerY = targetCenterY;
  let rotate = 0;
  if (placement === 'left') { pointerX = rect.left - 18; rotate = 0; }
  if (placement === 'right') { pointerX = rect.right + 18; rotate = 180; }
  if (placement === 'top') { pointerY = rect.top - 18; rotate = 90; }
  if (placement === 'bottom') { pointerY = rect.bottom + 18; rotate = -90; }
  Object.assign(tour.pointer.style, {
    left: `${clamp(pointerX, 18, window.innerWidth - 18)}px`,
    top: `${clamp(pointerY, 18, window.innerHeight - 18)}px`,
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
  });
}

function restoreSidebar(tour: ActiveTour): void {
  if (!isMobile(tour.config)) return;
  setMobileSidebar(tour.initialSidebarOpen);
}

function stopTour(completed: boolean): void {
  const tour = activeTour;
  if (!tour) return;
  tour.target?.classList.remove('dashboard-tour-target');
  tour.resizeObserver?.disconnect();
  tour.controller.abort();
  restoreSidebar(tour);
  tour.root.remove();
  document.body.classList.remove('dashboard-tour-open');
  if (completed) storageWrite(localStorage, tour.config.storage.completedKey, String(tour.config.version));
  activeTour = undefined;
}

async function renderStep(tour: ActiveTour, requestedIndex: number, direction: 1 | -1): Promise<void> {
  let index = requestedIndex;
  while (index >= 0 && index < tour.config.steps.length) {
    const step = tour.config.steps[index];
    if (!step) return;
    const context = stepContext(step, tour.config);
    if (isMobile(tour.config)) setMobileSidebar(context === 'sidebar');
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const target = resolveTarget(step, tour.config);
    if (step.target.type === 'center' || target) {
      tour.target?.classList.remove('dashboard-tour-target');
      tour.resizeObserver?.disconnect();
      tour.target = target;
      tour.stepIndex = index;
      if (target) {
        target.classList.add('dashboard-tour-target');
        target.scrollIntoView({ behavior: tour.config.settings.scrollBehavior, block: 'nearest', inline: 'nearest' });
        tour.resizeObserver = new ResizeObserver(() => positionTour(tour));
        tour.resizeObserver.observe(target);
      }
      tour.card.innerHTML = `<button type="button" class="dashboard-tour__close" data-tour-cancel aria-label="${escapeHtml(tour.config.ui.closeAriaLabel)}" title="${escapeHtml(tour.config.ui.cancelLabel)}">${icon('close')}</button>
        <div class="dashboard-tour__meta"><span>${escapeHtml(counterText(tour.config, index))}</span><i style="--tour-progress:${((index + 1) / tour.config.steps.length) * 100}%"></i></div>
        <div class="dashboard-tour__heading"><span>${icon(step.icon || 'tips_and_updates')}</span><div><h2>${escapeHtml(step.title)}</h2><p>${escapeHtml(step.text)}</p></div></div>
        <div class="dashboard-tour__actions">
          <button type="button" class="button button--ghost" data-tour-cancel>${escapeHtml(tour.config.ui.cancelLabel)}</button>
          <span></span>
          <button type="button" class="button button--secondary" data-tour-previous ${index === 0 ? 'disabled' : ''}>${icon('arrow_forward')} ${escapeHtml(tour.config.ui.previousLabel)}</button>
          <button type="button" class="button button--primary" data-tour-next>${escapeHtml(index === tour.config.steps.length - 1 ? tour.config.ui.finishLabel : tour.config.ui.nextLabel)} ${icon(index === tour.config.steps.length - 1 ? 'check' : 'arrow_back')}</button>
        </div>`;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      positionTour(tour);
      tour.card.querySelector<HTMLButtonElement>('[data-tour-next]')?.focus({ preventScroll: true });
      return;
    }
    index += direction;
  }
  stopTour(direction > 0);
}

async function startTour(config: TourConfig): Promise<void> {
  if (!config.enabled || activeTour || location.pathname !== '/panel') return;
  const root = document.createElement('div');
  root.className = 'dashboard-tour';
  root.dataset.dashboardTourRoot = 'true';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.innerHTML = `<div class="dashboard-tour__spotlight"></div><div class="dashboard-tour__pointer" aria-hidden="true">➜</div><section class="dashboard-tour__card" aria-live="polite"></section>`;
  document.body.append(root);
  document.body.classList.add('dashboard-tour-open');

  const controller = new AbortController();
  const tour: ActiveTour = {
    config,
    root,
    card: root.querySelector<HTMLElement>('.dashboard-tour__card')!,
    spotlight: root.querySelector<HTMLElement>('.dashboard-tour__spotlight')!,
    pointer: root.querySelector<HTMLElement>('.dashboard-tour__pointer')!,
    controller,
    stepIndex: 0,
    initialSidebarOpen: store.get().sidebarOpen,
  };
  activeTour = tour;
  storageRemove(localStorage, config.storage.registrationPendingKey);
  storageRemove(sessionStorage, config.storage.manualPendingKey);
  window.scrollTo({ top: 0, behavior: 'auto' });

  root.addEventListener('click', (event) => {
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest('[data-tour-cancel]')) { stopTour(false); return; }
    if (element?.closest('[data-tour-previous]')) { void renderStep(tour, tour.stepIndex - 1, -1); return; }
    if (element?.closest('[data-tour-next]')) {
      if (tour.stepIndex >= config.steps.length - 1) stopTour(true);
      else void renderStep(tour, tour.stepIndex + 1, 1);
    }
  }, { signal: controller.signal });
  window.addEventListener('resize', () => positionTour(tour), { passive: true, signal: controller.signal });
  window.addEventListener('scroll', () => positionTour(tour), { passive: true, signal: controller.signal, capture: true });
  window.addEventListener('popstate', () => stopTour(false), { signal: controller.signal });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') stopTour(false);
    if (event.key === 'ArrowLeft') void renderStep(tour, tour.stepIndex + 1, 1);
    if (event.key === 'ArrowRight') void renderStep(tour, tour.stepIndex - 1, -1);
  }, { signal: controller.signal });

  await renderStep(tour, 0, 1);
}

async function startPendingTour(): Promise<void> {
  autoStartScheduled = false;
  if (location.pathname !== '/panel' || activeTour) return;
  try {
    const config = await loadConfig();
    if (!config.enabled) return;
    const registered = storageRead(localStorage, config.storage.registrationPendingKey)
      || storageRead(localStorage, DEFAULT_REGISTRATION_KEY);
    const manual = storageRead(sessionStorage, config.storage.manualPendingKey)
      || storageRead(sessionStorage, DEFAULT_MANUAL_KEY);
    if (!registered && !manual) return;
    await startTour(config);
  } catch {
    // The dashboard remains fully usable when the optional tour file is unavailable.
  }
}

export function scheduleDashboardTourAutoStart(): void {
  if (autoStartScheduled) return;
  autoStartScheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(() => void startPendingTour()));
}

export async function requestDashboardTourStart(): Promise<void> {
  try {
    const config = await loadConfig(true);
    if (!config.enabled) return;
    storageWrite(sessionStorage, config.storage.manualPendingKey, '1');
    if (location.pathname !== '/panel') {
      router.navigate('/panel');
      return;
    }
    scheduleDashboardTourAutoStart();
  } catch {
    notify('تنظیمات راهنمای داشبورد دریافت نشد. دوباره تلاش کنید.', 'error');
  }
}

export function bindDashboardTourGuide(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-dashboard-tour-start]');
  if (!button) return;
  button.hidden = true;
  void loadConfig().then((config) => {
    if (!config.enabled || !button.isConnected) return;
    const label = button.querySelector<HTMLElement>('[data-dashboard-tour-guide-label]');
    if (label) label.textContent = config.ui.guideLabel;
    button.title = config.ui.guideTitle;
    button.setAttribute('aria-label', config.ui.guideTitle);
    button.hidden = false;
  }).catch(() => {
    if (!button.isConnected) return;
    button.hidden = false;
    const label = button.querySelector<HTMLElement>('[data-dashboard-tour-guide-label]');
    if (label) label.textContent = 'راهنما';
  });
  button.addEventListener('click', () => void requestDashboardTourStart());
}
