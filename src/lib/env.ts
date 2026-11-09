const params = new URLSearchParams(window.location.search);

/** `?shots` makes the page deterministic for the screenshot script. */
export const SHOTS = params.has('shots');

/** The phone layout: the same breakpoint as the phone styles in site/styles/features.css. */
export const PHONE_WIDTH = '(max-width: 640px)';

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A smartphone: a touch screen with no hover whose short side is under 600px
 * (tablets are wider). Holds in portrait and landscape alike.
 */
export const isPhone = () =>
  window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
  Math.min(window.screen.width, window.screen.height) < 600;

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
