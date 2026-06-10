/**
 * Landing creature based on the original Anime.js grid demo supplied for TeaCloud.
 * Anime.js is loaded lazily so a CDN failure never blocks the rest of the app.
 */

type AnimeInstance = {
  cancel: () => AnimeInstance;
  pause: () => AnimeInstance;
  play: () => AnimeInstance;
  restart: () => AnimeInstance;
  revert?: () => AnimeInstance;
  currentTime: number;
};

interface TimelineInstance extends AnimeInstance {
  add: (target: unknown, parameters: Record<string, unknown>, position?: number | string) => TimelineInstance;
}

type AnimeModule = {
  animate: (targets: unknown, parameters: Record<string, unknown>) => AnimeInstance;
  createTimeline: (parameters?: Record<string, unknown>) => TimelineInstance;
  createTimer: (parameters?: Record<string, unknown>) => AnimeInstance;
  stagger: (value: unknown, parameters?: Record<string, unknown>) => unknown;
  utils: {
    set: (targets: unknown, properties: Record<string, unknown>) => unknown;
    round: (precision?: number) => (value: number) => number;
    remove: (targets: unknown, instance?: AnimeInstance, propertyName?: string) => unknown;
  };
};

interface CreatureRuntime {
  controller: AbortController;
  wrapper: HTMLElement;
  particles: HTMLElement[];
  mainLoop: AnimeInstance;
  autoMove: AnimeInstance;
  manualMovementTimeout: AnimeInstance;
  anime: AnimeModule;
  manualMovement: boolean;
}

const ANIME_MODULE_URL = 'https://esm.sh/animejs@4.5.0';
const IDLE_DELAY_MS = 1_500;
const DESKTOP_ROWS = 13;
const COMPACT_ROWS = 9;

let creatureRuntime: CreatureRuntime | null = null;
let animeModulePromise: Promise<AnimeModule> | null = null;
let creatureGeneration = 0;

function loadAnime(): Promise<AnimeModule> {
  if (!animeModulePromise) {
    // The browser loads the official ESM build only when the Landing page is rendered.
    animeModulePromise = import(ANIME_MODULE_URL) as Promise<AnimeModule>;
  }
  return animeModulePromise;
}

function preferredRows(): number {
  return window.matchMedia('(max-width: 760px)').matches ? COMPACT_ROWS : DESKTOP_ROWS;
}

function cancelInstance(instance: AnimeInstance | null | undefined): void {
  try {
    instance?.cancel();
  } catch {
    // The instance may already have been removed by Anime.js cleanup.
  }
}

export function stopLandingCreature(): void {
  creatureGeneration += 1;
  document.querySelectorAll<HTMLElement>('.public-shell--creature').forEach((shell) => shell.classList.remove('public-shell--creature'));
  document.querySelectorAll<HTMLElement>('[data-landing-creature]').forEach((wrapper) => {
    wrapper.classList.remove('is-following-pointer', 'landing-creature--ready', 'landing-creature--reduced-motion', 'landing-creature--load-failed');
  });
  const runtime = creatureRuntime;
  creatureRuntime = null;
  if (!runtime) return;

  runtime.controller.abort();
  cancelInstance(runtime.manualMovementTimeout);
  cancelInstance(runtime.autoMove);
  cancelInstance(runtime.mainLoop);
  try {
    runtime.anime.utils.remove(runtime.particles);
  } catch {
    // The DOM can already be detached during a route transition.
  }
  runtime.wrapper.classList.remove('is-following-pointer', 'landing-creature--ready');
}

function buildParticles(creatureElement: HTMLElement, rows: number): HTMLElement[] {
  const fragment = document.createDocumentFragment();
  const particles: HTMLElement[] = [];
  creatureElement.replaceChildren();

  for (let index = 0; index < rows * rows; index += 1) {
    const particle = document.createElement('div');
    particle.className = 'landing-creature__particle';
    fragment.appendChild(particle);
    particles.push(particle);
  }

  creatureElement.appendChild(fragment);
  return particles;
}

async function initialiseLandingCreature(generation: number): Promise<void> {
  const wrapper = document.querySelector<HTMLElement>('[data-landing-creature]');
  const creatureElement = wrapper?.querySelector<HTMLElement>('[data-landing-creature-grid]');
  const shell = wrapper?.closest<HTMLElement>('.public-shell');
  if (!wrapper || !creatureElement || !shell) return;

  shell.classList.add('public-shell--creature');
  wrapper.classList.remove('is-following-pointer', 'landing-creature--ready', 'landing-creature--reduced-motion', 'landing-creature--load-failed');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rows = preferredRows();
  const grid: [number, number] = [rows, rows];
  const from = 'center';
  const particles = buildParticles(creatureElement, rows);

  let anime: AnimeModule;
  try {
    anime = await loadAnime();
  } catch (error) {
    if (generation === creatureGeneration && wrapper.isConnected) {
      wrapper.classList.add('landing-creature--load-failed', 'landing-creature--ready');
      console.warn('Anime.js could not be loaded for the landing creature.', error);
    }
    return;
  }

  if (generation !== creatureGeneration || !wrapper.isConnected) return;

  const { animate, createTimeline, createTimer, stagger, utils } = anime;
  const viewport = { w: window.innerWidth * 0.5, h: window.innerHeight * 0.5 };
  const cursor = { x: 0, y: 0 };
  const scaleStagger = stagger([2, 5], { ease: 'inQuad', grid, from });
  const opacityStagger = stagger([1, 0.1], { grid, from });
  const hueStagger = stagger([190, 262], {
    grid,
    from,
    modifier: (value: number) => `hsl(${Math.round(value)}, 86%, 61%)`,
  });

  utils.set(creatureElement, {
    width: `${rows * 10}em`,
    height: `${rows * 10}em`,
  });

  utils.set(particles, {
    x: 0,
    y: 0,
    scale: scaleStagger,
    opacity: opacityStagger,
    color: hueStagger,
    background: 'currentColor',
    boxShadow: stagger([8, 1], {
      grid,
      from,
      modifier: (value: number) => `0 0 ${Math.round(value)}em 0 currentColor`,
    }),
    zIndex: stagger([rows * rows, 1], {
      grid,
      from,
      modifier: (value: number) => Math.round(value),
    }),
  });

  wrapper.classList.add('landing-creature--ready');

  if (reducedMotion) {
    wrapper.classList.add('landing-creature--reduced-motion');
    return;
  }

  const pulse = (): void => {
    animate(particles, {
      keyframes: [
        {
          scale: 5,
          opacity: 1,
          delay: stagger(90, { start: 1_650, grid, from }),
          duration: 150,
        },
        {
          scale: scaleStagger,
          opacity: opacityStagger,
          ease: 'inOutQuad',
          duration: 600,
        },
      ],
    });
  };

  // Retargeting at 12fps keeps the original delayed follow-through while the
  // generated tweens themselves remain smooth at the browser refresh rate.
  const mainLoop = createTimer({
    frameRate: window.matchMedia('(max-width: 760px)').matches ? 10 : 12,
    onUpdate: () => {
      animate(particles, {
        x: cursor.x,
        y: cursor.y,
        delay: stagger(30, { grid, from }),
        duration: stagger(120, { start: 650, ease: 'inQuad', grid, from }),
        ease: 'inOut',
        composition: 'blend',
      });
    },
  });

  const autoMove = createTimeline({
    frameRate: 30,
  });

  autoMove
    .add(cursor, {
      x: [-viewport.w * 0.45, viewport.w * 0.45],
      modifier: (x: number) => x + Math.sin(mainLoop.currentTime * 0.0007) * viewport.w * 0.5,
      duration: 3_000,
      ease: 'inOutExpo',
      alternate: true,
      loop: true,
      onBegin: pulse,
      onLoop: pulse,
    }, 0)
    .add(cursor, {
      y: [-viewport.h * 0.45, viewport.h * 0.45],
      modifier: (y: number) => y + Math.cos(mainLoop.currentTime * 0.00012) * viewport.h * 0.5,
      duration: 1_000,
      ease: 'inOutQuad',
      alternate: true,
      loop: true,
    }, 0);

  const manualMovementTimeout = createTimer({
    duration: IDLE_DELAY_MS,
    autoplay: false,
    onComplete: () => {
      const runtime = creatureRuntime;
      if (!runtime || runtime.wrapper !== wrapper) return;
      runtime.manualMovement = false;
      wrapper.classList.remove('is-following-pointer');
      autoMove.play();
    },
  });

  const controller = new AbortController();
  const runtime: CreatureRuntime = {
    controller,
    wrapper,
    particles,
    mainLoop,
    autoMove,
    manualMovementTimeout,
    anime,
    manualMovement: false,
  };
  creatureRuntime = runtime;

  const updateViewport = (): void => {
    viewport.w = window.innerWidth * 0.5;
    viewport.h = window.innerHeight * 0.5;
  };

  const followPointer = (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    cursor.x = event.clientX - viewport.w;
    cursor.y = event.clientY - viewport.h;
    runtime.manualMovement = true;
    wrapper.classList.add('is-following-pointer');
    autoMove.pause();
    manualMovementTimeout.restart();
  };

  const syncVisibility = (): void => {
    if (document.hidden) {
      mainLoop.pause();
      autoMove.pause();
      manualMovementTimeout.pause();
      return;
    }
    mainLoop.play();
    if (runtime.manualMovement) manualMovementTimeout.play();
    else autoMove.play();
  };

  document.addEventListener('pointermove', followPointer, { passive: true, signal: controller.signal });
  window.addEventListener('resize', updateViewport, { passive: true, signal: controller.signal });
  document.addEventListener('visibilitychange', syncVisibility, { signal: controller.signal });
}

export function startLandingCreature(): void {
  stopLandingCreature();
  const generation = creatureGeneration;
  void initialiseLandingCreature(generation);
}
