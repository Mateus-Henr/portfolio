import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SocialKind } from '../content';
import { usePortfolio } from './content';
import { cx } from '../lib/env';
import { SECTION_ICON, Sticker, SocialIcon, sectionTone } from './icons';
import { IsoIcon } from './isoIcons';
import { sectionText, type SectionId, type SiteConfig } from './config';

/** macOS-style title bar with traffic lights (the version 04 cards). */
export function WindowBar({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="wbar">
      <span className="wbar__lights" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {title && <span className="wbar__title">{title}</span>}
      {children}
    </div>
  );
}

export function SectionHead({
  id,
  config,
  action,
  align,
}: {
  id: SectionId;
  config: SiteConfig;
  action?: ReactNode;
  align?: 'left' | 'center';
}) {
  const text = sectionText(config, id);
  const centered = align === 'center' || (align === undefined && config.centered);
  return (
    <header className={cx('shead', centered && 'shead--center')} data-reveal>
      {config.sectionIcons === 'iso' ? <IsoIcon id={id} size={72} /> : <Sticker Icon={SECTION_ICON[id]} tone={sectionTone(id)} size="md" />}
      <div className="shead__text">
        <p className="shead__eyebrow">{text.eyebrow}</p>
        <h2 className="shead__title">{text.title}</h2>
        {text.intro && <p className="shead__intro">{text.intro}</p>}
      </div>
      {action && <div className="shead__action">{action}</div>}
    </header>
  );
}

export function Chips({ items, max, small }: { items: string[]; max?: number; small?: boolean }) {
  const shown = max ? items.slice(0, max) : items;
  const rest = max ? items.length - shown.length : 0;
  return (
    <ul className={cx('chips', small && 'chips--sm')}>
      {shown.map((item) => (
        <li className="chip" key={item}>
          {item}
        </li>
      ))}
      {rest > 0 && (
        <li className="chip chip--more" title={items.slice(max).join(', ')}>
          +{rest}
        </li>
      )}
    </ul>
  );
}

export interface PillOption {
  id: string;
  label: string;
  Icon?: LucideIcon;
  count?: number;
  tone?: string;
}

/**
 * Rounded menu of choices with a highlight that slides to the selected one.
 * Used to filter projects and certificates by area.
 */
export function Pills({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: PillOption[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const bar = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const place = () => {
      const active = el.querySelector<HTMLElement>('.pill[aria-pressed="true"]');
      if (!active) return;
      el.style.setProperty('--thumb-x', `${active.offsetLeft}px`);
      el.style.setProperty('--thumb-y', `${active.offsetTop}px`);
      el.style.setProperty('--thumb-w', `${active.offsetWidth}px`);
      el.style.setProperty('--thumb-h', `${active.offsetHeight}px`);
      const tone = active.dataset.tone;
      if (tone) el.style.setProperty('--thumb-tone', tone);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div className={cx('pills', className)} role="group" aria-label={label} ref={bar}>
      <span className="pills__thumb" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="pill"
          aria-pressed={o.id === value}
          data-tone={o.tone}
          style={o.tone ? ({ '--tone': o.tone } as CSSProperties) : undefined}
          onClick={() => onChange(o.id)}
        >
          {o.Icon && <o.Icon size={16} strokeWidth={2.2} aria-hidden="true" />}
          <span>{o.label}</span>
          {o.count !== undefined && <span className="pill__count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Social links shown right under the greeting (and again in the contact section). */
export function Socials({
  look = 'pills',
  className,
  spelled = false,
  exclude,
}: {
  look?: 'pills' | 'icons' | 'list';
  className?: string;
  /** Show the address itself (e.g. "github.com/Mateus-Henr") instead of the network name. */
  spelled?: boolean;
  /** Links to leave out, e.g. the email where a bigger email button is already shown. */
  exclude?: SocialKind[];
}) {
  const portfolio = usePortfolio();
  const links = exclude ? portfolio.socials.filter((s) => !exclude.includes(s.kind)) : portfolio.socials;
  return (
    <ul className={cx('socials', `socials--${look}`, className)}>
      {links.map((s) => (
        <li key={s.kind} className={`socials__item socials__item--${s.kind}`}>
          <a
            className={cx('social', `social--${s.kind}`)}
            href={s.url}
            target={s.kind === 'email' || s.kind === 'phone' ? undefined : '_blank'}
            rel={s.kind === 'email' || s.kind === 'phone' ? undefined : 'noreferrer'}
            aria-label={look === 'icons' ? s.label : undefined}
            title={s.display}
          >
            <span className="social__icon">
              <SocialIcon kind={s.kind} size={17} />
            </span>
            {look !== 'icons' && <span className="social__label">{spelled ? (s.display ?? s.label) : s.label}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Number of columns a CSS grid currently shows (follows the responsive breakpoints). */
export function useGridColumns(grid: { current: HTMLElement | null }, remount?: unknown) {
  const [cols, setCols] = useState(3);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const measure = () => {
      const tracks = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      setCols(Math.max(1, tracks));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid, remount]);
  return cols;
}

/** Centred "See more" / "See less" button under a list. */
export function SeeMore({ open, hidden, onClick }: { open: boolean; hidden: number; onClick: () => void }) {
  return (
    <div className="more">
      <button type="button" className="more__btn" aria-expanded={open} onClick={onClick}>
        {open ? 'See less' : `See more (${hidden})`}
        <ChevronDown size={17} strokeWidth={2.4} aria-hidden="true" className={open ? 'more__chev is-up' : 'more__chev'} />
      </button>
    </div>
  );
}
