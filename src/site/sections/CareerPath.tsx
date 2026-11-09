import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ChevronDown, ChevronRight, ChevronsDown, ExternalLink, FileText, Flag, MapPin, Route } from 'lucide-react';
import type { CareerStep, CareerType } from '../../content';
import { usePortfolio } from '../content';
import { PHONE_WIDTH, cx, prefersReducedMotion } from '../../lib/env';
import { useMediaQuery } from '../../lib/hooks';
import { usePdfViewer } from '../../components/pdf/PdfViewer';
import { CAREER_META, Sticker, careerTone } from '../icons';
import { embedUrl, stepDates } from '../format';
import type { CareerLayout, CareerLine, SiteConfig } from '../config';
import { Chips, SectionHead } from '../ui';
import { TechChips } from '../tech';
import { useLang, useT } from '../../i18n';

const TYPES: CareerType[] = ['study', 'work', 'research', 'milestone'];
const RAIL_X = 41; // x of the rail in the single-column layout: centre of the step icons, px

/** Horizontal centre of a step (fraction of the width) and its card width. */
function place(layout: CareerLayout, step: CareerStep, index: number): { x: number; w: number } {
  const small = step.type === 'milestone';
  if (layout === 'lanes') {
    const lane = { study: 0.27, research: 0.5, work: 0.73, milestone: 0.5 }[step.type];
    return { x: lane, w: small ? 0.4 : 0.52 };
  }
  if (layout === 'zigzag') {
    if (small) return { x: 0.5, w: 0.42 };
    return { x: index % 2 === 0 ? 0.31 : 0.69, w: 0.6 };
  }
  return { x: 0, w: 1 };
}

function linkPath(line: CareerLine, x1: number, x2: number, h: number) {
  if (line === 'circuit') {
    if (Math.abs(x1 - x2) < 1) return `M${x1} 0 V${h}`;
    const r = Math.min(12, Math.abs(x2 - x1) / 2);
    const dir = x2 > x1 ? 1 : -1;
    const mid = h / 2;
    return `M${x1} 0 V${mid - r} Q${x1} ${mid} ${x1 + dir * r} ${mid} H${x2 - dir * r} Q${x2} ${mid} ${x2} ${mid + r} V${h}`;
  }
  return `M${x1} 0 C${x1} ${h * 0.55} ${x2} ${h * 0.45} ${x2} ${h}`;
}

// memoised: when a step opens, the links that did not change are skipped
const Connector = memo(function Connector({
  x1,
  x2,
  width,
  height,
  line,
  lit,
  next,
  tone,
  follow = false,
}: {
  x1: number;
  x2: number;
  width: number;
  height: number;
  line: CareerLine;
  lit: boolean;
  next: boolean;
  tone: string;
  follow?: boolean;
}) {
  const d = linkPath(line, x1, x2, height);
  const GAP = height;
  return (
    <div className={cx('cp__link', lit && 'is-lit', next && 'is-next')} style={{ '--tone': tone, height } as CSSProperties} aria-hidden="true">
      <svg width={width} height={GAP} viewBox={`0 0 ${width} ${GAP}`}>
        <path className="cp__link-base" d={d} />
        <path className="cp__link-lit" d={d} pathLength={1} />
        {line === 'circuit' && (
          <>
            <circle className="cp__pad" cx={x1} cy={3} r={4} />
            <circle className="cp__pad" cx={x2} cy={GAP - 3} r={4} />
          </>
        )}
        {line === 'stars' && <path className="cp__star" d={starPath((x1 + x2) / 2, GAP / 2, 6)} />}
      </svg>
      {(next || follow) && <span className="cp__walker" style={{ offsetPath: `path('${d}')` } as CSSProperties} />}
    </div>
  );
});

const SLIDE: KeyframeAnimationOptions = { id: 'cp-slide', duration: 340, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
let slideRun = 0;
/** True while a slide runs: the light that follows the scroll waits for it to end. */
let slideActive = false;
let curtain: HTMLElement | null = null;
let tail: HTMLElement | null = null;

function dropCurtain() {
  curtain?.style.removeProperty('--curtain');
  curtain?.removeAttribute('data-curtain');
  curtain = null;
  tail?.style.removeProperty('--tail');
  tail?.removeAttribute('data-tail');
  tail = null;
}

/**
 * Phones: a step opens or closes at once and everything under it slides into
 * place. Only transforms move, which the phone's graphics chip handles by
 * itself: nothing is laid out or repainted while it slides (a height
 * animation stutters there). While a card opens, the first piece below it
 * carries a white curtain that hides the card's new lines until the slide
 * uncovers them, so the card still looks like it is growing.
 */
function slideBelow(step: HTMLElement, dy: number, done: () => void) {
  if (!dy) return;
  const run = ++slideRun;
  slideActive = true;
  const section = step.closest('section');
  const below: HTMLElement[] = [];
  for (let el = step.nextElementSibling; el; el = el.nextElementSibling) below.push(el as HTMLElement);
  const finish = section?.querySelector<HTMLElement>('.cp__cap--finish');
  if (finish) below.push(finish);
  for (let el = section?.nextElementSibling; el; el = el.nextElementSibling) below.push(el as HTMLElement);
  const footer = document.querySelector<HTMLElement>('.foot2');
  if (footer) below.push(footer);

  // Read everything first. Each piece starts where it is on screen now (a
  // slide still running included); only what crosses the screen slides,
  // the rest just jumps to its place unseen.
  const screen = window.innerHeight;
  const plan = below.map((el) => {
    const now = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
    const box = el.getBoundingClientRect();
    const start = box.top - dy;
    const end = box.top - now;
    const seen = Math.min(start, end) < screen && Math.max(start, end) + box.height > 0;
    return { el, from: now - dy, seen };
  });
  // a new slide replaces the one still running (the pieces off screen jump unseen)
  plan.forEach(({ el }) => el.getAnimations().forEach((a) => a.id === SLIDE.id && a.cancel()));
  dropCurtain();

  // Web animations need no style flush in between and leave nothing behind
  const movers = plan.filter((p) => p.seen);
  if (dy > 0 && movers[0]) {
    // tall enough to cover the card's new lines and the shadow under them
    curtain = movers[0].el;
    curtain.style.setProperty('--curtain', `${dy + 60}px`);
    curtain.setAttribute('data-curtain', '');
  }
  const slides = movers.map(({ el, from }) => el.animate([{ transform: `translateY(${from}px)` }, { transform: 'none' }], SLIDE));
  // Closing on the minimal timeline: the next step carries a piece of the line
  // above it that shrinks with the gap, so the line never breaks while it closes
  const next = movers[0]?.el;
  if (dy < 0 && next?.classList.contains('cp__step') && next.closest('.cp--minimal')) {
    tail = next;
    tail.style.setProperty('--tail', `${-dy}px`);
    tail.setAttribute('data-tail', '');
    try {
      tail.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { ...SLIDE, pseudoElement: '::after' });
    } catch {
      // browsers that cannot animate a pseudo-element just show the gap
    }
  }
  Promise.all(slides.map((a) => a.finished.catch(() => {}))).then(() => {
    if (run !== slideRun) return;
    dropCurtain();
    slideActive = false;
    done();
  });
}

function starPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * The career path as a flowchart people can follow: steps are linked by a
 * winding path, every step opens like a dropdown (only the first starts
 * open), "Next step" walks along the path and lights it up as you go. The
 * path can stop after its first few steps, with "See more".
 *
 * Phones get a minimal timeline instead: one light row per step (its kind,
 * a dot on a thin line, the role, where and when), all closed until pressed.
 */
export function CareerPath({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const { layout: wanted, line, order } = config.career;
  const phone = useMediaQuery(PHONE_WIDTH);
  // the light that follows the scroll is left out on phones: it redraws on every scroll frame
  const follow = config.career.follow === 'scroll' && !phone;
  const hide = config.career.filter === 'hide';
  const steps = useMemo(() => (order === 'newest' ? [...portfolio.career].reverse() : portfolio.career), [order, portfolio]);
  const viewer = usePdfViewer();
  const { lang } = useLang();
  const t = useT();

  const [open, setOpen] = useState<Set<string>>(() => new Set(phone ? [] : [steps[0].id]));
  const [reached, setReached] = useState(0);
  const [focus, setFocus] = useState<CareerType | null>(null);
  const [width, setWidth] = useState(1000);
  const [expanded, setExpanded] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const pending = useRef<string | null>(null);
  const firstNew = useRef<string | null>(null);
  const sliding = useRef<{ id: string; height: number } | null>(null);
  const refreshFollow = useRef(() => {});

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    // the list also changes height (a step opens): only a new width matters here
    let last = -1;
    const measure = () => {
      if (el.clientWidth === last) return;
      last = el.clientWidth;
      setWidth(last);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // narrow screens always use the single rail
  const layout: CareerLayout = width < 760 ? 'rail' : wanted;
  // with the "hide" filter, only the chosen kind of step stays on the path
  const matching = hide && focus ? steps.filter((s) => s.type === focus) : steps;
  // only the first steps show until "See more" (it never hides a single step)
  const limit = config.career.steps;
  const cut = limit !== undefined && !expanded && matching.length > limit + 1;
  const shown = cut ? matching.slice(0, limit) : matching;

  // "scroll" mode: the light travels along the path with the page, and the step
  // under the reading line is highlighted. Attributes, not classes, so React
  // re-renders never wipe them.
  useEffect(() => {
    const el = list.current;
    if (!follow || !el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (slideActive) return; // refreshed once the slide ends
      const mid = window.innerHeight * 0.45;
      const links = Array.from(el.querySelectorAll<HTMLElement>('.cp__link'));
      let ball = -1;
      links.forEach((link, i) => {
        const r = link.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
        link.style.setProperty('--p', p.toFixed(3));
        if (p > 0) ball = i;
      });
      links.forEach((link, i) => link.toggleAttribute('data-ball', i === ball));
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('.cp__node'));
      let best = -1;
      let bestD = Infinity;
      nodes.forEach((n, i) => {
        const r = n.getBoundingClientRect();
        const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      nodes.forEach((n, i) => n.toggleAttribute('data-current', i === best && bestD < window.innerHeight * 0.3));
      // the finish flag lights up once the reading line reaches it
      const finish = el.parentElement?.querySelector<HTMLElement>('.cp__end--finish');
      finish?.toggleAttribute('data-lit', finish.getBoundingClientRect().top < mid);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    refreshFollow.current = onScroll;
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
      refreshFollow.current = () => {};
      el.querySelectorAll('[data-current]').forEach((n) => n.removeAttribute('data-current'));
    };
  }, [follow, focus, layout, width]);

  // after "Next step", bring the newly opened step into view once it has expanded
  useEffect(() => {
    const id = pending.current;
    if (!id) return;
    pending.current = null;
    const t = window.setTimeout(() => {
      document.getElementById(`cp-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 380);
    return () => window.clearTimeout(t);
  }, [open]);

  // phones: the step has just opened or closed at once; slide the rest into place
  useLayoutEffect(() => {
    const s = sliding.current;
    if (!s) return;
    sliding.current = null;
    const step = document.getElementById(`cp-${s.id}`);
    const card = step?.querySelector<HTMLElement>('.cp__node');
    if (step && card) slideBelow(step, card.offsetHeight - s.height, () => refreshFollow.current());
  }, [open]);

  // after "See more" the button is gone: move focus to the first step that appeared
  useEffect(() => {
    const id = firstNew.current;
    if (!id) return;
    firstNew.current = null;
    document.querySelector<HTMLElement>(`#cp-${id} .cp__head`)?.focus({ preventScroll: true });
  }, [expanded]);

  const showAll = () => {
    firstNew.current = matching[shown.length]?.id ?? null;
    setExpanded(true);
  };

  // a new filter starts short again, like the projects (dimming changes nothing on the path)
  const pick = (type: CareerType | null) => {
    setFocus(type);
    if (hide) setExpanded(false);
  };

  const toggle = (id: string, index: number) => {
    // phones (no height animation there): note the card's height to slide from
    const card = document.getElementById(`cp-${id}`)?.querySelector<HTMLElement>('.cp__node');
    if (phone && card && !prefersReducedMotion()) sliding.current = { id, height: card.offsetHeight };
    setOpen((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
    setReached((r) => Math.max(r, index));
  };

  const walk = (index: number) => {
    const current = steps[index];
    const following = steps[index + 1];
    if (!following) return;
    setOpen((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(current.id);
      nextSet.add(following.id);
      return nextSet;
    });
    setReached((r) => Math.max(r, index + 1));
    if (limit !== undefined && index + 1 >= limit) setExpanded(true);
    pending.current = following.id;
  };

  const counts = TYPES.map((type) => ({ type, n: steps.filter((s) => s.type === type).length }));
  const first = shown[0];
  const last = shown[shown.length - 1];
  const startLabel = order === 'oldest' ? t.career.start : t.career.today;
  const endLabel = order === 'oldest' ? t.career.today : t.career.began;

  return (
    <section id="career" className={cx('sec2', 'cp', `cp--${layout}`, `cp--line-${line}`, follow && 'cp--follow', phone && 'cp--minimal')}>
      <div className="wrap">
        <SectionHead id="career" config={config} />

        <div className="cp__legend" role="group" aria-label={hide ? t.career.filterHide : t.career.filterDim} data-reveal>
          {hide && (
            <button
              type="button"
              className={cx('cp__key', !focus && 'is-on')}
              aria-pressed={!focus}
              style={{ '--tone': 'var(--accent)' } as CSSProperties}
              onClick={() => pick(null)}
            >
              <Route size={15} strokeWidth={2.2} aria-hidden="true" />
              {t.career.all}
              <span className="cp__key-n">{steps.length}</span>
            </button>
          )}
          {counts.map(({ type, n }) => {
            const { Icon } = CAREER_META[type];
            const label = t.career.types[type];
            return (
              <button
                key={type}
                type="button"
                className={cx('cp__key', focus === type && 'is-on')}
                aria-pressed={focus === type}
                style={{ '--tone': careerTone(type) } as CSSProperties}
                onClick={() => pick(hide || focus !== type ? type : null)}
              >
                <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                {label}
                <span className="cp__key-n">{n}</span>
              </button>
            );
          })}
        </div>

        {!phone && (
        <div className="cp__cap cp__cap--start" style={{ '--x': `${place(layout, first, 0).x * 100}%` } as CSSProperties} data-reveal>
        <div className="cp__end cp__end--start">
          <span className="cp__flag" aria-hidden="true">
            {order === 'oldest' ? <Flag size={16} /> : <MapPin size={16} />}
          </span>
          <span>
            <strong>{startLabel}</strong> · {first.start.slice(0, 4)} · {first.place}
          </span>
        </div>
        </div>
        )}

        <ol className="cp__list" ref={list} data-focus={focus ?? undefined}>
          {shown.map((step, i) => {
            const pos = place(layout, step, i);
            const prev = i > 0 ? place(layout, shown[i - 1], i - 1) : null;
            const isOpen = open.has(step.id);
            const { Icon } = CAREER_META[step.type];
            const label = t.career.types[step.type];
            const following = shown[i + 1];
            const index = steps.indexOf(step);
            const cert = step.certificate ? portfolio.certificates.find((c) => c.id === step.certificate) : undefined;
            const certSrc = cert ? embedUrl(cert) : null;
            const x1 = prev ? (layout === 'rail' ? RAIL_X : prev.x * width) : 0;
            const x2 = layout === 'rail' ? RAIL_X : pos.x * width;
            return (
              <li
                key={step.id}
                id={`cp-${step.id}`}
                className={cx('cp__step', `cp__step--${step.type}`, !hide && focus && focus !== step.type && 'is-dim')}
                style={{ '--x': `${pos.x * 100}%`, '--w': `${pos.w * 100}%`, '--tone': careerTone(step.type) } as CSSProperties}
              >
                {prev && !phone && (
                  <Connector
                    x1={x1}
                    x2={x2}
                    width={width}
                    height={layout === 'rail' ? 30 : 64}
                    line={line}
                    lit={i <= reached}
                    next={!follow && i === reached + 1}
                    tone={careerTone(step.type)}
                    follow={follow}
                  />
                )}
                <article className={cx('cp__node', 'card', isOpen && 'is-open', !step.end && 'is-now')} data-reveal>
                  <button
                    type="button"
                    className="cp__head"
                    aria-expanded={isOpen}
                    aria-controls={`cp-panel-${step.id}`}
                    onClick={() => toggle(step.id, index)}
                  >
                    {phone ? (
                      // minimal row: kind, a dot on the line, then role, where and when
                      <>
                        <span className="cp__icon" aria-hidden="true">
                          <Icon size={17} strokeWidth={2.2} />
                        </span>
                        <span className="cp__dot" aria-hidden="true" />
                        <span className="cp__titles">
                          <span className="cp__title">
                            <span className="visually-hidden">{label}: </span>
                            {step.role}
                          </span>
                          <span className="cp__org">{step.org}</span>
                          <span className="cp__when">{stepDates(step, lang)}</span>
                        </span>
                        <span className="cp__chev" aria-hidden="true">
                          <ChevronRight size={18} />
                        </span>
                      </>
                    ) : (
                      <>
                        <Sticker Icon={Icon} tone={careerTone(step.type)} size={step.type === 'milestone' ? 'sm' : 'md'} />
                        <span className="cp__titles">
                          <span className="cp__when">
                            {stepDates(step, lang)} <span className="cp__type">· {label}</span>
                          </span>
                          <span className="cp__headline">{step.headline}</span>
                          <span className="cp__role">
                            {step.role} · {step.org}
                          </span>
                        </span>
                        {!step.end && <span className="cp__now">{t.career.now}</span>}
                        <ChevronDown className="cp__chev" size={20} aria-hidden="true" />
                      </>
                    )}
                  </button>
                  <div className="cp__panel" id={`cp-panel-${step.id}`} role="region" aria-label={step.headline} inert={!isOpen}>
                    <div className="cp__panel-inner">
                      <div className="cp__body">
                        {phone && <p className="cp__lead">{step.headline}</p>}
                        <p className="cp__place">
                          <MapPin size={14} aria-hidden="true" /> {step.place}
                        </p>
                        <p className="cp__story">{step.story}</p>
                        {step.points.length > 0 && (
                          <ul className="cp__points">
                            {step.points.map((pt) => (
                              <li key={pt}>{pt}</li>
                            ))}
                          </ul>
                        )}
                        {step.tools.length > 0 &&
                          (config.techIcons ? <TechChips items={step.tools} /> : <Chips items={step.tools} small />)}
                        <div className="cp__actions">
                          {cert && (certSrc ? (
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={() => viewer.open({ title: cert.title, subtitle: cert.issuer, src: certSrc, href: cert.file })}
                            >
                              <FileText size={15} aria-hidden="true" /> {t.career.viewCertificate}
                            </button>
                          ) : (
                            cert.file && (
                              <a className="soft-btn" href={cert.file} target="_blank" rel="noreferrer">
                                <ExternalLink size={15} aria-hidden="true" /> {t.career.openCertificate}
                              </a>
                            )
                          ))}
                          {step.link && (
                            <a className="soft-btn" href={step.link.url} target="_blank" rel="noreferrer">
                              <ExternalLink size={15} aria-hidden="true" /> {step.link.label}
                            </a>
                          )}
                          {following && !follow && !phone && !(hide && focus) && (
                            <button type="button" className="cp__next" onClick={() => walk(index)}>
                              {t.career.nextStep}: {following.headline} <ArrowDown size={15} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>

        {(cut || !phone) && (
        <div className={cx('cp__cap', 'cp__cap--finish', cut && 'cp__cap--more')} style={{ '--x': `${place(layout, last, steps.length - 1).x * 100}%` } as CSSProperties} data-reveal>
        {cut ? (
          // a shortened path ends in "See more", where the rest of it continues
          <button type="button" className="cp__end cp__more" onClick={showAll}>
            <span className="cp__flag" aria-hidden="true">
              <ChevronsDown size={16} />
            </span>
            <span>
              <strong>{t.career.seeMore}</strong> · {order === 'newest' ? t.career.earlier(matching.length - shown.length) : t.career.later(matching.length - shown.length)}
            </span>
          </button>
        ) : (
        <div className={cx('cp__end', 'cp__end--finish', reached >= steps.length - 1 && 'is-lit')}>
          <span className="cp__flag" aria-hidden="true">
            {order === 'oldest' ? <MapPin size={16} /> : <Flag size={16} />}
          </span>
          <span>
            <strong>{endLabel}</strong> · {last.role} · {last.org}
          </span>
        </div>
        )}
        </div>
        )}
      </div>
    </section>
  );
}
