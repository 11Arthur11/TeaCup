# Landing Creature

The Landing background uses the original 13 × 13 Anime.js creature model supplied for TeaCloud.

## Runtime behavior

- The particle group keeps the original compact `130em × 130em` footprint with `font-size: .2vh`.
- Pointer movement pauses automatic movement and moves the creature freely across the viewport.
- Automatic movement resumes after 1500 ms of pointer inactivity.
- Pulse, scale, opacity, movement delay, and movement duration use Anime.js stagger utilities.
- The movement retarget timer runs at 12 fps on desktop and 10 fps on compact screens. Anime.js continues interpolating the tweens between retargets.
- Compact screens use a 9 × 9 grid to reduce paint and compositing cost.
- All timers and animations pause while the browser tab is hidden and are cancelled on route changes.
- Reduced-motion users receive a static version.

## Dependency

Anime.js v4.5.0 is loaded lazily from the ESM endpoint only on the Landing route:

```text
https://esm.sh/animejs@4.5.0
```

A loading failure does not block TeaCloud; it falls back to the static ambient background.

The original supplied reference files are preserved in `docs/creature-reference/`.
