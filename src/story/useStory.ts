import { useCallback, useRef, useState, type RefObject } from 'react';
import { gsap, useGSAP } from '../lib/motion';
import { SHOTS, prefersReducedMotion } from '../lib/env';

export type Query = (selector: string) => Element[];
export type StoryState = 'ready' | 'playing' | 'paused' | 'ended';

/** What a scene gets to build its story with. */
export interface StoryKit {
  /** The story timeline, in seconds. It autoplays once when the page opens. */
  tl: gsap.core.Timeline;
  q: Query;
  /** L('sun') selects [data-layer="sun"]. */
  L: (name: string) => Element[];
  /**
   * Shows a caption from `at` seconds until the next one. Pass a function to
   * look the text up when it shows (it can change language meanwhile).
   */
  say: (at: number, text: string | (() => string)) => void;
  /** Registers a looping animation that plays in the background and pauses with the story. */
  loop: <T extends gsap.core.Animation>(animation: T) => T;
  /** Runs when the scene is removed. */
  onCleanup: (fn: () => void) => void;
  root: HTMLElement;
}

interface Caption {
  at: number;
  text: string | (() => string);
}

const captionText = (caption: Caption) => (typeof caption.text === 'function' ? caption.text() : caption.text);

declare global {
  interface Window {
    __story?: { seek: (progress: number) => void; duration: number; tl: gsap.core.Timeline };
  }
}

/**
 * Builds the story timeline and plays it as soon as the page opens. It pauses
 * while the stage is scrolled out of view, and for visitors who prefer reduced
 * motion it shows the final frame and waits for them to press replay.
 */
export function useStory(
  root: RefObject<HTMLElement | null>,
  parts: { caption: RefObject<HTMLElement | null>; progress: RefObject<HTMLElement | null> },
  build: (kit: StoryKit) => void,
  { delay = 0.5 }: { delay?: number } = {},
) {
  const [state, setState] = useState<StoryState>('ready');
  const api = useRef<{ toggle: () => void; replay: () => void; refreshCaption: () => void }>({
    toggle: () => {},
    replay: () => {},
    refreshCaption: () => {},
  });

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el) as Query;
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut', duration: 0.6 } });
      const captions: Caption[] = [];
      const loops: gsap.core.Animation[] = [];
      const cleanups: (() => void)[] = [];
      let userPaused = false;
      let offscreen = false;

      const kit: StoryKit = {
        tl,
        q,
        L: (name) => q(`[data-layer="${name}"]`),
        say: (at, text) => captions.push({ at, text }),
        loop: (animation) => {
          loops.push(animation);
          return animation;
        },
        onCleanup: (fn) => cleanups.push(fn),
        root: el,
      };

      build(kit);
      captions.sort((a, b) => a.at - b.at);
      // run through once so every tween records its starting values, then rewind
      tl.progress(1, true).progress(0, true);

      // captions follow the playhead, so seeking and replaying always show the right one
      let shown = -2;
      const showCaption = () => {
        const t = tl.time();
        let index = -1;
        for (let i = 0; i < captions.length; i++) if (captions[i].at <= t + 0.001) index = i;
        if (index === shown) return;
        shown = index;
        const node = parts.caption.current;
        if (!node) return;
        const text = index >= 0 ? captionText(captions[index]) : '';
        node.textContent = text;
        node.classList.remove('is-in');
        if (text) {
          void node.offsetWidth;
          node.classList.add('is-in');
        }
      };
      const showProgress = () => {
        const bar = parts.progress.current;
        if (bar) bar.style.transform = `scaleX(${tl.progress().toFixed(4)})`;
      };

      tl.eventCallback('onUpdate', () => {
        showCaption();
        showProgress();
      });
      const setLoops = (run: boolean) => {
        loops.forEach((loop) => (run ? loop.play() : loop.pause()));
        el.toggleAttribute('data-paused', !run);
      };

      let current: StoryState = 'ready';
      const go = (next: StoryState) => {
        current = next;
        setState(next);
      };
      tl.eventCallback('onComplete', () => go('ended'));

      api.current = {
        toggle: () => {
          if (current === 'ready' || current === 'playing' || current === 'ended') {
            // pause the story (before it starts: cancel the autoplay; once it has finished: its background loops)
            userPaused = true;
            tl.pause();
            setLoops(false);
            go('paused');
            return;
          }
          userPaused = false;
          setLoops(!offscreen);
          if (tl.progress() < 1) {
            tl.play();
            go('playing');
          } else {
            go('ended');
          }
        },
        replay: () => {
          userPaused = false;
          setLoops(!offscreen);
          tl.restart();
          go('playing');
        },
        // shows the current caption again, e.g. in a new language
        refreshCaption: () => {
          shown = -2;
          showCaption();
        },
      };

      window.__story = {
        tl,
        duration: tl.duration(),
        seek: (p) => {
          tl.pause();
          tl.progress(p);
          showCaption();
          showProgress();
        },
      };

      if (SHOTS) {
        tl.progress(1).pause();
        loops.forEach((loop) => loop.pause());
        showCaption();
        go('ended');
      } else if (prefersReducedMotion()) {
        // still frame on the finished picture: the visitor can press replay to watch it
        tl.progress(1).pause();
        userPaused = true;
        setLoops(false);
        el.dataset.motion = 'reduced';
        showCaption();
        showProgress();
        go('ended');
      } else {
        tl.progress(0);
        showCaption();
        gsap.delayedCall(delay, () => {
          if (userPaused) return;
          tl.play();
          go('playing');
        });
      }

      // pause everything while the stage is off screen
      const io = new IntersectionObserver(
        ([entry]) => {
          offscreen = !entry.isIntersecting;
          el.toggleAttribute('data-offscreen', offscreen);
          if (userPaused || SHOTS || prefersReducedMotion()) return;
          if (offscreen) {
            if (tl.progress() < 1) tl.pause();
            loops.forEach((loop) => loop.pause());
          } else {
            if (tl.progress() > 0 && tl.progress() < 1) tl.play();
            loops.forEach((loop) => loop.play());
          }
        },
        { threshold: 0.05 },
      );
      io.observe(el);

      return () => {
        io.disconnect();
        cleanups.forEach((fn) => fn());
        if (window.__story?.tl === tl) delete window.__story;
      };
    },
    { scope: root },
  );

  const refreshCaption = useCallback(() => api.current.refreshCaption(), []);

  return {
    state,
    toggle: () => api.current.toggle(),
    replay: () => api.current.replay(),
    refreshCaption,
  };
}
