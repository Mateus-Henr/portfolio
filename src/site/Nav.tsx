import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import { MapPin } from 'lucide-react';
import { usePortfolio } from './content';
import { cx } from '../lib/env';
import { useActiveSection, useScrolled } from '../lib/hooks';
import { SECTION_ICON, SECTION_ICON_ALT, Sticker, sectionTone } from './icons';
import { Logo, LogoMark } from './Logo';
import { SECTION_ORDER, sectionText, type SiteConfig } from './config';
import { Socials } from './ui';

const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `${location.search}#${id}`);
};

const toTop = (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function Brand({ floating, monogram, logo }: { floating?: boolean; monogram?: boolean; logo?: boolean }) {
  const portfolio = usePortfolio();
  if (logo) {
    return (
      <a className={cx('brand', 'brand--logo', floating && 'brand--float')} href="#top" onClick={toTop} aria-label={`${portfolio.profile.name}, back to top`}>
        <Logo name={portfolio.profile.name} size={34} />
      </a>
    );
  }
  return (
    <a className={cx('brand', floating && 'brand--float')} href="#top" onClick={toTop}>
      <span className={cx('brand__mark', monogram && 'brand__mark--mono')} aria-hidden="true">
        {monogram ? portfolio.profile.name.charAt(0) : <LogoMark size={34} />}
      </span>
      <span className="brand__name">{portfolio.profile.name}</span>
    </a>
  );
}

/** Navigation for the "top" shell. Each look is styled in site.css. */
export function Nav({ config }: { config: SiteConfig }) {
  const active = useActiveSection(SECTION_ORDER);
  const scrolled = useScrolled(40);
  const list = useRef<HTMLUListElement>(null);
  const look = config.nav;
  const floatingBrand = look === 'dock' || look === 'rail';

  // sliding highlight for the tabs look
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || look !== 'tabs') return;
    const link = el.querySelector<HTMLElement>('.navx__link.is-active');
    el.style.setProperty('--tab-x', link ? `${link.offsetLeft}px` : '0px');
    el.style.setProperty('--tab-w', link ? `${link.offsetWidth}px` : '0px');
    el.toggleAttribute('data-has-active', !!link);
  }, [active, look]);

  return (
    <>
      {floatingBrand && <Brand floating monogram={config.brand === 'monogram'} logo={config.brand === 'logo'} />}
      <nav className={cx('navx', `navx--${look}`, scrolled && 'is-scrolled', config.navMobileBottom && 'navx--mbottom')} aria-label="Sections">
        {!floatingBrand && <Brand monogram={config.brand === 'monogram'} logo={config.brand === 'logo'} />}
        <ul className="navx__list" ref={list}>
          {look === 'tabs' && <li className="navx__tab" aria-hidden="true" />}
          {SECTION_ORDER.map((id) => {
            const Icon = config.sectionIcons === 'iso' ? SECTION_ICON_ALT[id] : SECTION_ICON[id];
            const text = sectionText(config, id).nav;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={cx('navx__link', active === id && 'is-active')}
                  aria-current={active === id ? 'true' : undefined}
                  onClick={(event) => go(event, id)}
                >
                  {look === 'dock' || look === 'rail' ? (
                    <Sticker Icon={Icon} tone={sectionTone(id)} size="sm" tilt={false} />
                  ) : (
                    <Icon className="navx__glyph" size={16} strokeWidth={2.1} aria-hidden="true" />
                  )}
                  <span className="navx__label">{text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** Sticky profile column for the "sidebar" shell: portrait, name, socials and section links. */
export function Sidebar({ config }: { config: SiteConfig }) {
  const active = useActiveSection(SECTION_ORDER);
  const portfolio = usePortfolio();
  const p = portfolio.profile;
  return (
    <aside className="sidebar">
      <a className="sidebar__me" href="#top" onClick={toTop}>
        <span className="sidebar__portrait">
          <LogoMark size={56} />
        </span>
        <span>
          <strong className="sidebar__name">{p.name}</strong>
          <span className="sidebar__role">{p.role}</span>
        </span>
      </a>
      <p className="sidebar__where">
        <MapPin size={15} aria-hidden="true" /> {p.location}
      </p>
      <nav aria-label="Sections">
        <ul className="sidebar__nav">
          {SECTION_ORDER.map((id) => {
            const Icon = SECTION_ICON[id];
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={cx('sidebar__link', active === id && 'is-active')}
                  aria-current={active === id ? 'true' : undefined}
                  onClick={(event) => go(event, id)}
                >
                  <Sticker Icon={Icon} tone={sectionTone(id)} size="xs" tilt={false} />
                  {sectionText(config, id).nav}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <Socials look="list" className="sidebar__socials" />
    </aside>
  );
}
