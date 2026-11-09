import { useState, type MouseEvent } from 'react';
import { ArrowUp, Check, Copy, Send } from 'lucide-react';
import { usePortfolio } from '../content';
import { cx } from '../../lib/env';
import type { SiteConfig } from '../config';
import { SectionHead, Socials, WindowBar } from '../ui';

function CopyEmail({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="ghost-btn"
      onClick={() => {
        navigator.clipboard?.writeText(email).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      {done ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {done ? 'Copied' : 'Copy email'}
    </button>
  );
}

export function Contact({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const c = portfolio.contact;
  const look = config.contact;

  return (
    <section id="contact" className={cx('sec2', 'contact2', `contact2--${look}`)}>
      <div className="wrap">
        <SectionHead id="contact" config={config} />
        {look === 'terminal' || look === 'terminal-light' ? (
          <div className={cx('term', 'card', look === 'terminal-light' && 'term--light')} data-reveal>
            <WindowBar title="matt@portfolio: ~" />
            <div className="term__body">
              <p>
                <span className="term__prompt">$</span> echo "{c.headline}"
              </p>
              <p className="term__out">{c.headline}</p>
              <p>
                <span className="term__prompt">$</span> cat contact.txt
              </p>
              <p className="term__out">{c.text}</p>
              <div className="term__row">
                <a className="btn2 btn2--primary" href={`mailto:${c.email}`}>
                  <Send size={17} aria-hidden="true" /> {c.email}
                </a>
                <CopyEmail email={c.email} />
              </div>
              <Socials look="pills" className="term__socials" spelled={look === 'terminal-light'} />
              <p>
                <span className="term__prompt">$</span> <span className="term__cursor" />
              </p>
            </div>
          </div>
        ) : (
          <div className={cx('contact2__card', 'card')} data-reveal>
            {look === 'window' && <WindowBar title="new-message" />}
            <div className="contact2__inner">
              <h3 className="contact2__headline">{c.headline}</h3>
              <p className="contact2__text">{c.text}</p>
              <div className="contact2__row">
                <a className="btn2 btn2--primary" href={`mailto:${c.email}`}>
                  <Send size={17} aria-hidden="true" /> {c.email}
                </a>
                <CopyEmail email={c.email} />
              </div>
              <Socials look="pills" className="contact2__socials" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Footer({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const toTop = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <footer className="foot2">
      <div className="wrap foot2__inner">
        <p>
          © {new Date().getFullYear()} {portfolio.profile.name}
          {config.footer && !config.minimalFooter ? ` · ${config.footer}` : ''}
        </p>
        {!config.minimalFooter && (
          <a href="#top" onClick={toTop}>
            Back to top <ArrowUp size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </footer>
  );
}
