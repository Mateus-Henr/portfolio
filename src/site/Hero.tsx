import type { ReactNode } from 'react';
import { BriefcaseBusiness, MapPin } from 'lucide-react';
import { usePortfolio } from './content';
import { cx } from '../lib/env';
import { useLang, useT } from '../i18n';
import type { SiteConfig } from './config';
import { Socials } from './ui';

/** Greeting, subtitle, social links and the animation, in one of three arrangements. */
export function Hero({ config, scene }: { config: SiteConfig; scene: ReactNode }) {
  const portfolio = usePortfolio();
  const { lang } = useLang();
  const t = useT();
  const p = portfolio.profile;
  const current = portfolio.career.find((s) => !s.end);
  const align = config.heroAlign ?? (config.hero === 'stacked' ? 'center' : 'left');
  const eyebrow = config.eyebrow?.[lang];

  const text = (
    <div className={cx('hero2__text', `hero2__text--${align}`)}>
      {eyebrow && <p className="hero2__eyebrow">{eyebrow}</p>}
      <h1 className="hero2__title">{p.greeting}</h1>
      <p className="hero2__sub">{p.tagline}</p>
      <Socials className="hero2__socials" />
    </div>
  );

  if (config.hero === 'bento') {
    return (
      <header className="hero2 hero2--bento" id="top">
        <div className="wrap hero2__bento">
          <div className="bento__tile bento__tile--text card">{text}</div>
          <div className="bento__tile bento__tile--stage">{scene}</div>
          <div className="bento__tile bento__tile--now card">
            <span className="bento__label">
              <BriefcaseBusiness size={15} aria-hidden="true" /> {t.hero.now}
            </span>
            <strong>{current?.role ?? p.role}</strong>
            <span>{current?.org}</span>
          </div>
          <div className="bento__tile bento__tile--where card">
            <span className="bento__label">
              <MapPin size={15} aria-hidden="true" /> {t.hero.basedIn}
            </span>
            <strong>{p.location}</strong>
            <span>{t.hero.remote}</span>
          </div>
          {p.stats.slice(0, 2).map((s) => (
            <div className="bento__tile bento__tile--stat card" key={s.label}>
              <strong className="bento__value">{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </header>
    );
  }

  return (
    <header className={cx('hero2', `hero2--${config.hero}`, config.heroFlip && 'hero2--flip')} id="top">
      <div className={cx('wrap', config.hero === 'split' && 'hero2__split')}>
        {text}
        <div className="hero2__stage">{scene}</div>
      </div>
    </header>
  );
}
