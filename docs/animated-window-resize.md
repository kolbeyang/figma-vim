# Animated plugin window resize

## Finding

Animating the outer Figma plugin window is possible, but GSAP is unnecessary for this plugin.

`figma.ui.resize(width, height)` is the API that changes the host window. The UI iframe cannot call it directly, so an animation running in `src/ui.html` must send intermediate dimensions to the plugin sandbox. The existing `figma.ui.onmessage` handler in `code.js` already provides that bridge.

A short `requestAnimationFrame` tween is preferable to GSAP here:

- The animation only interpolates two numbers: width and height.
- GSAP would still need an `onUpdate` callback that posts dimensions across the iframe boundary.
- Repeated host-window resizing may appear less smooth than an ordinary DOM transform, regardless of the tweening library.
- A native tween avoids adding a runtime dependency for one small interaction.

Recommended approach: animate from `120 × 40` to `300 × 360` over roughly 180–220 ms with an ease-out curve, send rounded dimensions once per animation frame, reveal help content during expansion, and hide it only after collapse completes. Respect `prefers-reduced-motion` by resizing immediately.

## Sources

- [Figma Plugin API typings](https://github.com/figma/plugin-typings/blob/master/plugin-api.d.ts) — `UIAPI.resize(width, height)` and `showUI` sizing behavior.
- [GSAP `gsap.to()` documentation](https://gsap.com/docs/v3/GSAP/gsap.to()/) — `onUpdate` runs on each animation tick.
