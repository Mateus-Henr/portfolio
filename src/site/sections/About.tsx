import { usePortfolio } from '../content';
import { cx } from '../../lib/env';
import { LogoMark } from '../Logo';
import type { SiteConfig } from '../config';
import { Chips, SectionHead, WindowBar } from '../ui';
import { TechChips } from '../tech';

function Facts() {
  const portfolio = usePortfolio();
  return (
    <dl className="facts2">
      {portfolio.profile.facts.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Skills({ icons = false }: { icons?: boolean }) {
  const portfolio = usePortfolio();
  return (
    <div className="skills2">
      {portfolio.profile.skills.map((g) => (
        <div className="skills2__group" key={g.group}>
          <p className="skills2__title">{g.group}</p>
          {icons ? <TechChips items={g.items} /> : <Chips items={g.items} small />}
        </div>
      ))}
    </div>
  );
}

function Stats({ className }: { className?: string }) {
  const portfolio = usePortfolio();
  return (
    <ul className={cx('stats2', className)}>
      {portfolio.profile.stats.map((s) => (
        <li className="stat2 card" key={s.label} data-reveal>
          <strong className="stat2__value">{s.value}</strong>
          <span className="stat2__label">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function About({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const p = portfolio.profile;
  const look = config.about;

  return (
    <section id="about" className={cx('sec2', 'about2', `about2--${look}`)}>
      <div className="wrap">
        <SectionHead id="about" config={config} />

        {look === 'bento' && (
          <div className="about2__bento">
            <div className="card about2__story" data-reveal>
              {config.windowCards && <WindowBar title="about-me.md" />}
              <div className="about2__pad">
                {p.summary.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </div>
            </div>
            <Stats className="about2__stats" />
            <div className="card about2__facts" data-reveal>
              {config.windowCards && <WindowBar title="quick-facts" />}
              <div className="about2__pad">
                <Facts />
              </div>
            </div>
            <div className="card about2__skills" data-reveal>
              {config.windowCards && <WindowBar title="skills" />}
              <div className="about2__pad">
                <Skills />
              </div>
            </div>
          </div>
        )}

        {look === 'files' && (
          <div className="about2__files">
            <div className="card about2__story" data-reveal>
              <WindowBar title="about-me.md" />
              <div className="about2__pad">
                {p.summary.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </div>
            </div>
            <div className="card about2__facts" data-reveal>
              <WindowBar title="quick-facts" />
              <div className="about2__pad">
                <Facts />
              </div>
            </div>
            <div className="card about2__skills" data-reveal>
              <WindowBar title="skills.md" />
              <div className="about2__pad">
                <Skills icons={config.techIcons} />
              </div>
            </div>
          </div>
        )}

        {look === 'window' && (
          <div className="about2__grid">
            <div className="about2__main" data-reveal>
              <div className="about2__copy">
                {p.summary.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </div>
              <Stats />
            </div>
            <aside className="card about2__side" data-reveal>
              <WindowBar title="matt.json" />
              <div className="about2__pad">
                <Facts />
                <Skills icons={config.techIcons} />
              </div>
            </aside>
          </div>
        )}

        {look === 'profile' && (
          <div className="about2__profile">
            <div className="card about2__card" data-reveal>
              {config.windowCards && <WindowBar title="profile" />}
              <div className="about2__pad about2__me">
                <span className="about2__portrait">
                  <LogoMark size={96} />
                </span>
                <div>
                  <p className="about2__name">{p.name}</p>
                  <p className="about2__role">
                    {p.role} · {p.location}
                  </p>
                </div>
              </div>
              <div className="about2__pad about2__pad--top0">
                <Facts />
              </div>
            </div>
            <div className="about2__right" data-reveal>
              <div className="about2__copy">
                {p.summary.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </div>
              <div className="card about2__skills">
                {config.windowCards && <WindowBar title="skills" />}
                <div className="about2__pad">
                  <Skills />
                </div>
              </div>
            </div>
            <Stats className="about2__stats--row" />
          </div>
        )}
      </div>
    </section>
  );
}
