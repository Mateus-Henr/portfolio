import type { CSSProperties, ReactNode } from 'react';

type Tl = gsap.core.Timeline;
type Target = gsap.TweenTarget;

/** Deterministic pseudo-random numbers, so every replay looks the same. */
export function seeded(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** An <svg> that fills its layer, drawn in its own w x h coordinates. */
export function Art({ w, h, children, className, style }: { w: number; h: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className ? `art ${className}` : 'art'} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={style}>
      {children}
    </svg>
  );
}

/** Types `text` into an element, one character at a time. Returns the end time. */
export function typeText(tl: Tl, target: Target, text: string, at: number, cps = 18) {
  const duration = Math.max(0.2, text.length / cps);
  tl.to(target, { text: { value: text }, duration, ease: 'none' }, at);
  return at + duration;
}

/** Pops something into place from nothing, growing from its base. */
export function pop(tl: Tl, target: Target, at: number, { duration = 0.6, origin = '50% 100%', ease = 'back.out(1.8)', stagger = 0 } = {}) {
  tl.fromTo(
    target,
    { scale: 0, autoAlpha: 0, transformOrigin: origin },
    { scale: 1, autoAlpha: 1, duration, ease, stagger, transformOrigin: origin },
    at,
  );
  return at + duration;
}

/** Hides elements at time 0 (so a replay starts clean). */
export function hide(tl: Tl, target: Target) {
  tl.set(target, { autoAlpha: 0 }, 0);
}

export interface ConfettiPiece {
  x: number;
  y: number;
  color: string;
  w: number;
  h: number;
  dx: number;
  dy: number;
  spin: number;
}

/** Pieces of confetti bursting from (x, y), as data for <Confetti>. */
export function makeConfetti(count: number, x: number, y: number, colors: string[], seed = 3, spread = 520): ConfettiPiece[] {
  const r = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.1;
    const power = 0.45 + r() * 0.55;
    return {
      x,
      y,
      color: colors[i % colors.length],
      w: 10 + r() * 10,
      h: 6 + r() * 8,
      dx: Math.cos(angle) * spread * power,
      dy: Math.sin(angle) * spread * 0.9 * power,
      spin: (r() - 0.5) * 900,
    };
  });
}

export function Confetti({ pieces, name = 'confetti' }: { pieces: ConfettiPiece[]; name?: string }) {
  return (
    <div className="layer confetti" data-layer={name} style={{ left: 0, top: 0, width: 1, height: 1 }}>
      {pieces.map((p, i) => (
        <i
          key={i}
          className="confetti__bit"
          style={{ left: p.x, top: p.y, width: p.w, height: p.h, background: p.color } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** Fires the confetti made with makeConfetti(): up and out, then falling. */
export function burst(tl: Tl, root: Element, pieces: ConfettiPiece[], at: number, name = 'confetti') {
  const bits = root.querySelectorAll(`[data-layer="${name}"] .confetti__bit`);
  bits.forEach((bit, i) => {
    const p = pieces[i];
    tl.fromTo(bit, { x: 0, y: 0, rotation: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, at);
    tl.to(bit, { x: p.dx, duration: 1.6, ease: 'power2.out' }, at);
    tl.to(bit, { y: p.dy, duration: 0.7, ease: 'power2.out' }, at);
    tl.to(bit, { y: p.dy + 520, duration: 1.4, ease: 'power1.in' }, at + 0.7);
    tl.to(bit, { rotation: p.spin, duration: 2.1, ease: 'none' }, at);
    tl.to(bit, { autoAlpha: 0, duration: 0.4 }, at + 1.7);
  });
  return at + 2.1;
}

/**
 * Film-style camera on the scene: frames the point (cx, cy) of the 1600x1000
 * canvas at `zoom`, never showing anything outside the canvas.
 */
export function cameraTo(cx: number, cy: number, zoom: number, w = 1600, h = 1000) {
  // zooming out (< 1) simply centres the point; zooming in never shows past the canvas edges
  if (zoom < 1) return { x: w / 2 - zoom * cx, y: h / 2 - zoom * cy, scale: zoom, transformOrigin: '0px 0px' };
  const x = Math.min(0, Math.max(w - w * zoom, w / 2 - zoom * cx));
  const y = Math.min(0, Math.max(h - h * zoom, h / 2 - zoom * cy));
  return { x, y, scale: zoom, transformOrigin: '0px 0px' };
}

export function shot(
  tl: Tl,
  camera: Target,
  cx: number,
  cy: number,
  zoom: number,
  at: number,
  duration = 1.2,
  ease = 'power2.inOut',
  size: [number, number] = [1600, 1000],
) {
  const view = cameraTo(cx, cy, zoom, size[0], size[1]);
  if (duration <= 0) tl.set(camera, view, at);
  else tl.to(camera, { ...view, duration, ease }, at);
  return at + Math.max(0, duration);
}

/** Counts a number up inside an element, e.g. a timer: 0 → 87 ms. */
export function countUp(tl: Tl, el: Element | undefined, to: number, at: number, duration: number, suffix = '', from = 0) {
  if (!el) return;
  const box = { v: from };
  tl.fromTo(
    box,
    { v: from },
    {
      v: to,
      duration,
      ease: 'power1.out',
      onUpdate: () => {
        el.textContent = `${Math.round(box.v)}${suffix}`;
      },
    },
    at,
  );
}
