import { useEffect, useState, type RefObject } from 'react';
import { SHOTS, prefersReducedMotion } from './env';

/** Id of the section currently in the middle of the screen. */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

/** True once the page has scrolled past `offset` pixels. */
export function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > offset));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [offset]);
  return scrolled;
}

/**
 * Fades elements marked with data-reveal in as they enter the screen.
 * The revealed state is stored in data attributes (data-in, data-reveal-ready)
 * because React rewrites className on every re-render: a class added here
 * would be dropped as soon as, say, a career step opens, and it would vanish.
 * The classes are still added for the first-round styles.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    const show = (item: Element) => {
      item.setAttribute('data-in', '');
      item.classList.add('is-in');
    };
    if (SHOTS || prefersReducedMotion()) {
      items.forEach(show);
      return;
    }
    el.setAttribute('data-reveal-ready', '');
    el.classList.add('reveal-ready');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
    );
    items.forEach((item) => io.observe(item));
    // elements added later (a filter brings steps back, "See more" adds cards) fade in too
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const found = node.matches('[data-reveal]') ? [node] : [];
          found.push(...node.querySelectorAll<HTMLElement>('[data-reveal]'));
          found.forEach((item) => {
            if (!item.hasAttribute('data-in')) io.observe(item);
          });
        });
      }
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [root]);
}
