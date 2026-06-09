interface CreatureParticle {
  element: HTMLSpanElement;
  x: number;
  y: number;
  follow: number;
  influence: number;
}

let creatureController: AbortController | null = null;
let creatureFrame = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function preferredRows(): number {
  if (window.matchMedia('(max-width: 560px)').matches) return 7;
  if (window.matchMedia('(max-width: 980px)').matches) return 9;
  return 13;
}

export function stopLandingCreature(): void {
  creatureController?.abort();
  creatureController = null;
  if (creatureFrame) window.cancelAnimationFrame(creatureFrame);
  creatureFrame = 0;
}

export function startLandingCreature(): void {
  stopLandingCreature();

  const wrapper = document.querySelector<HTMLElement>('[data-landing-creature]');
  const gridElement = wrapper?.querySelector<HTMLElement>('[data-landing-creature-grid]');
  const shell = wrapper?.closest<HTMLElement>('.public-shell');
  if (!wrapper || !gridElement || !shell) return;

  shell.classList.add('public-shell--creature');
  const controller = new AbortController();
  creatureController = controller;
  const { signal } = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rows = preferredRows();
  const center = (rows - 1) / 2;
  const particles: CreatureParticle[] = [];
  const fragment = document.createDocumentFragment();

  gridElement.style.setProperty('--creature-rows', String(rows));
  gridElement.replaceChildren();

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < rows; column += 1) {
      const dx = column - center;
      const dy = row - center;
      const distance = Math.sqrt((dx * dx) + (dy * dy));
      const normalizedDistance = clamp(distance / Math.max(1, center * Math.SQRT2), 0, 1);
      const centerWeight = 1 - normalizedDistance;
      const element = document.createElement('span');
      element.className = 'landing-creature__particle';
      const particleScale = 0.72 + centerWeight * 2.55;
      const particleOpacity = 0.1 + centerWeight * 0.72;
      const particleGlow = Math.round(5 + centerWeight * 24);
      element.style.setProperty('--particle-scale', particleScale.toFixed(3));
      element.style.setProperty('--particle-scale-pulse', (particleScale * 1.55).toFixed(3));
      element.style.setProperty('--particle-scale-soft', (particleScale * 0.92).toFixed(3));
      element.style.setProperty('--particle-opacity', particleOpacity.toFixed(3));
      element.style.setProperty('--particle-opacity-low', (particleOpacity * 0.72).toFixed(3));
      element.style.setProperty('--particle-opacity-high', Math.min(1, particleOpacity + 0.3).toFixed(3));
      element.style.setProperty('--particle-hue', String(Math.round(194 + centerWeight * 54 + ((row + column) % 5) * 3)));
      element.style.setProperty('--particle-lightness', `${Math.round(48 + centerWeight * 19)}%`);
      element.style.setProperty('--particle-glow', `${particleGlow}px`);
      element.style.setProperty('--particle-glow-wide', `${Math.round(particleGlow * 1.8)}px`);
      element.style.setProperty('--particle-delay', `${-Math.round((distance * 82) + ((row + column) % 3) * 55)}ms`);
      fragment.appendChild(element);
      particles.push({
        element,
        x: 0,
        y: 0,
        follow: 0.025 + centerWeight * 0.065,
        influence: 0.2 + centerWeight * 0.67,
      });
    }
  }

  gridElement.appendChild(fragment);
  if (reducedMotion) {
    wrapper.classList.add('landing-creature--reduced-motion');
    return;
  }

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const cursor = { x: 0, y: 0 };
  let lastManualMovement = 0;
  let previousFrame = 0;
  let pageVisible = !document.hidden;

  const syncViewport = (): void => {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
  };

  const followPointer = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' && !event.isPrimary) return;
    cursor.x = clamp(event.clientX - viewport.width / 2, -viewport.width * 0.48, viewport.width * 0.48);
    cursor.y = clamp(event.clientY - viewport.height / 2, -viewport.height * 0.48, viewport.height * 0.48);
    lastManualMovement = performance.now();
    wrapper.classList.add('is-following-pointer');
  };

  const onVisibilityChange = (): void => {
    pageVisible = !document.hidden;
    if (pageVisible && !creatureFrame) creatureFrame = window.requestAnimationFrame(renderFrame);
  };

  const renderFrame = (time: number): void => {
    creatureFrame = 0;
    if (signal.aborted || !wrapper.isConnected) {
      stopLandingCreature();
      return;
    }
    if (!pageVisible) return;

    if (time - previousFrame < 32) {
      creatureFrame = window.requestAnimationFrame(renderFrame);
      return;
    }
    previousFrame = time;

    const manual = time - lastManualMovement < 1_500;
    if (!manual) {
      wrapper.classList.remove('is-following-pointer');
      cursor.x = Math.sin(time * 0.00052) * viewport.width * 0.28
        + Math.sin(time * 0.00019) * viewport.width * 0.13;
      cursor.y = Math.cos(time * 0.00037) * viewport.height * 0.25
        + Math.sin(time * 0.00013) * viewport.height * 0.16;
    }

    particles.forEach((particle, index) => {
      const ripple = Math.sin((time * 0.0014) - index * 0.055) * (manual ? 3 : 8);
      const targetX = cursor.x * particle.influence + ripple;
      const targetY = cursor.y * particle.influence + Math.cos((time * 0.0011) - index * 0.042) * (manual ? 2 : 7);
      particle.x += (targetX - particle.x) * particle.follow;
      particle.y += (targetY - particle.y) * particle.follow;
      particle.element.style.transform = `translate3d(${particle.x.toFixed(2)}px, ${particle.y.toFixed(2)}px, 0)`;
    });

    creatureFrame = window.requestAnimationFrame(renderFrame);
  };

  window.addEventListener('pointermove', followPointer, { passive: true, signal });
  window.addEventListener('resize', syncViewport, { passive: true, signal });
  document.addEventListener('visibilitychange', onVisibilityChange, { signal });
  creatureFrame = window.requestAnimationFrame(renderFrame);
}
