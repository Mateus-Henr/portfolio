const params = new URLSearchParams(window.location.search);

/** `?shots` makes the page deterministic for the screenshot script. */
export const SHOTS = params.has('shots');

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
