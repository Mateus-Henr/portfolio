import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ChevronDown, ChevronsDownUp, ChevronsUpDown, ExternalLink, FileText, Flag, MapPin, Route } from 'lucide-react';
import type { CareerStep, CareerType } from '../../content';
import { usePortfolio } from '../content';
import { cx } from '../../lib/env';
import { usePdfViewer } from '../../components/pdf/PdfViewer';
import { CAREER_META, Sticker, careerTone } from '../icons';
import { embedUrl, stepDates } from '../format';
import type { CareerLayout, CareerLine, SiteConfig } from '../config';
import { Chips, SectionHead } from '../ui';
import { TechChips } from '../tech';

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

function Connector({
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
 * open), "Next step" walks along the path and lights it up as you go.
 */
export function CareerPath({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const { layout: wanted, line, order } = config.career;
  const follow = config.career.follow === 'scroll';
  const hide = config.career.filter === 'hide';
  const steps = useMemo(() => (order === 'newest' ? [...portfolio.career].reverse() : portfolio.career), [order, portfolio]);
  const viewer = usePdfViewer();

  const [open, setOpen] = useState<Set<string>>(() => new Set([steps[0].id]));
  const [reached, setReached] = useState(0);
  const [focus, setFocus] = useState<CareerType | null>(null);
  const [width, setWidth] = useState(1000);
  const list = useRef<HTMLOListElement>(null);
  const pending = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // narrow screens always use the single rail
  const layout: CareerLayout = width < 760 ? 'rail' : wanted;
  // with the "hide" filter, only the chosen kind of step stays on the path
  const shown = hide && focus ? steps.filter((s) => s.type === focus) : steps;

  // "scroll" mode: the light travels along the path with the page, and the step
  // under the reading line is highlighted. Attributes, not classes, so React
  // re-renders never wipe them.
  useEffect(() => {
    const el = list.current;
    if (!follow || !el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
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

  const toggle = (id: string, index: number) => {
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
    pending.current = following.id;
  };

  const allOpen = open.size === steps.length;
  const toggleAll = () => {
    if (allOpen) setOpen(new Set());
    else {
      setOpen(new Set(steps.map((s) => s.id)));
      setReached(steps.length - 1);
    }
  };

  const counts = TYPES.map((t) => ({ t, n: steps.filter((s) => s.type === t).length }));
  const first = shown[0];
  const last = shown[shown.length - 1];
  const startLabel = order === 'oldest' ? 'Start' : 'Today';
  const endLabel = order === 'oldest' ? 'Today' : 'Where it began';

  return (
    <section id="career" className={cx('sec2', 'cp', `cp--${layout}`, `cp--line-${line}`, follow && 'cp--follow')}>
      <div className="wrap">
        <SectionHead
          id="career"
          config={config}
          action={
            <button type="button" className="ghost-btn" onClick={toggleAll}>
              {allOpen ? <ChevronsDownUp size={16} aria-hidden="true" /> : <ChevronsUpDown size={16} aria-hidden="true" />}
              {allOpen ? 'Close all' : 'Open all'}
            </button>
          }
        />

        <div className="cp__legend" role="group" aria-label={hide ? 'Show only one kind of step' : 'Highlight one kind of step'} data-reveal>
          {hide && (
            <button
              type="button"
              className={cx('cp__key', !focus && 'is-on')}
              aria-pressed={!focus}
              style={{ '--tone': 'var(--accent)' } as CSSProperties}
              onClick={() => setFocus(null)}
            >
              <Route size={15} strokeWidth={2.2} aria-hidden="true" />
              All
              <span className="cp__key-n">{steps.length}</span>
            </button>
          )}
          {counts.map(({ t, n }) => {
            const { label, Icon } = CAREER_META[t];
            return (
              <button
                key={t}
                type="button"
                className={cx('cp__key', focus === t && 'is-on')}
                aria-pressed={focus === t}
                style={{ '--tone': careerTone(t) } as CSSProperties}
                onClick={() => setFocus((f) => (hide ? t : f === t ? null : t))}
              >
                <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                {label}
                <span className="cp__key-n">{n}</span>
              </button>
            );
          })}
        </div>

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

        <ol className="cp__list" ref={list} data-focus={focus ?? undefined}>
          {shown.map((step, i) => {
            const pos = place(layout, step, i);
            const prev = i > 0 ? place(layout, shown[i - 1], i - 1) : null;
            const isOpen = open.has(step.id);
            const { label, Icon } = CAREER_META[step.type];
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
                {prev && (
                  <Connector
                    x1={x1}
                    x2={x2}
                    width={width}
                    height={layout === 'rail' ? 40 : 64}
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
                    <Sticker Icon={Icon} tone={careerTone(step.type)} size={step.type === 'milestone' ? 'sm' : 'md'} />
                    <span className="cp__titles">
                      <span className="cp__when">
                        {stepDates(step)} <span className="cp__type">· {label}</span>
                      </span>
                      <span className="cp__headline">{step.headline}</span>
                      <span className="cp__role">
                        {step.role} · {step.org}
                      </span>
                    </span>
                    {!step.end && <span className="cp__now">Now</span>}
                    <ChevronDown className="cp__chev" size={20} aria-hidden="true" />
                  </button>
                  <div className="cp__panel" id={`cp-panel-${step.id}`} role="region" aria-label={step.headline} inert={!isOpen}>
                    <div className="cp__panel-inner">
                      <div className="cp__body">
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
                              <FileText size={15} aria-hidden="true" /> View certificate
                            </button>
                          ) : (
                            cert.file && (
                              <a className="soft-btn" href={cert.file} target="_blank" rel="noreferrer">
                                <ExternalLink size={15} aria-hidden="true" /> Open certificate
                              </a>
                            )
                          ))}
                          {step.link && (
                            <a className="soft-btn" href={step.link.url} target="_blank" rel="noreferrer">
                              <ExternalLink size={15} aria-hidden="true" /> {step.link.label}
                            </a>
                          )}
                          {following && !follow && !(hide && focus) && (
                            <button type="button" className="cp__next" onClick={() => walk(index)}>
                              Next step: {following.headline} <ArrowDown size={15} aria-hidden="true" />
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

        <div className="cp__cap cp__cap--finish" style={{ '--x': `${place(layout, last, steps.length - 1).x * 100}%` } as CSSProperties} data-reveal>
        <div className={cx('cp__end', 'cp__end--finish', reached >= steps.length - 1 && 'is-lit')}>
          <span className="cp__flag" aria-hidden="true">
            {order === 'oldest' ? <MapPin size={16} /> : <Flag size={16} />}
          </span>
          <span>
            <strong>{endLabel}</strong> · {last.role} · {last.org}
          </span>
        </div>
        </div>
      </div>
    </section>
  );
}
