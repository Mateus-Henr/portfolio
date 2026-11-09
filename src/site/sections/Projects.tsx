import { useRef, useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';
import { usePortfolio } from '../content';
import { cx } from '../../lib/env';
import { CATEGORY_ICON, Sticker, categoryTone } from '../icons';
import type { SiteConfig } from '../config';
import { Chips, Pills, SectionHead, SeeMore, WindowBar, useGridColumns, type PillOption } from '../ui';
import { TechChips } from '../tech';
import { ProjectScene } from '../projectScenes';
import { useT } from '../../i18n';

/**
 * Compact project cards with a rounded menu of areas on top. Picking an area
 * shows only its projects; the cards fade in, in place (nothing is taken out
 * of the page flow, so the next section never jumps over them). Optionally
 * only the first rows show until "See more", and each card can carry a small
 * animation that plays while the cursor is over it (on phones, as it scrolls
 * into view).
 */
export function Projects({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const t = useT();
  const { look, columns = 3, rows, scenes } = config.projects;
  const [area, setArea] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const grid = useRef<HTMLUListElement>(null);
  const cols = useGridColumns(grid, area);

  const options: PillOption[] = [
    { id: 'all', label: t.projects.all, Icon: CATEGORY_ICON.all, count: portfolio.projects.length },
    ...portfolio.projectCategories.map((c) => ({
      id: c.id,
      label: c.label,
      Icon: CATEGORY_ICON[c.id],
      count: portfolio.projects.filter((p) => p.categories.includes(c.id)).length,
      tone: categoryTone(c.id),
    })),
  ];

  const choose = (id: string) => {
    if (id === area) return;
    setArea(id);
    setExpanded(false);
  };

  const matching = portfolio.projects.filter((p) => area === 'all' || p.categories.includes(area));
  const limit = rows && !expanded ? rows * cols : Infinity;
  const shown = matching.slice(0, limit);
  const label = options.find((o) => o.id === area)?.label ?? 'All';

  return (
    <section id="projects" className={cx('sec2', 'pjs', `pjs--${look}`, scenes && 'pjs--scenes')}>
      <div className="wrap">
        <SectionHead id="projects" config={config} />
        <div className="pjs__menu" data-reveal>
          <Pills options={options} value={area} onChange={choose} label={t.projects.filter} />
        </div>
        <p className="visually-hidden" aria-live="polite">
          {area === 'all' ? t.projects.showingAll : t.projects.showingArea(label)}
        </p>
        {/* the key restarts the fade-in each time the area changes */}
        <ul className={cx('pjs__grid', `pjs__grid--${columns}`)} ref={grid} key={area}>
          {shown.map((p, i) => {
            const main = p.categories[0];
            const Icon = CATEGORY_ICON[main];
            return (
              <li
                key={p.id}
                className="pj card pj--in"
                style={{ '--tone': categoryTone(area !== 'all' ? area : main), '--i': i % 12 } as CSSProperties}
              >
                {config.windowCards && look !== 'list' && (
                  <WindowBar title={p.context}>
                    <span className="wbar__meta">{p.year}</span>
                  </WindowBar>
                )}
                {scenes && <ProjectScene id={p.id} />}
                <div className="pj__body">
                  <div className="pj__top">
                    <Sticker Icon={Icon} tone={categoryTone(main)} size="sm" />
                    <div className="pj__heading">
                      <h3 className="pj__title">{p.title}</h3>
                      {(!config.windowCards || look === 'list') && (
                        <p className="pj__context">
                          {p.context} · {p.year}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="pj__summary">{p.summary}</p>
                  {p.highlight ? (
                    <p className="pj__highlight">
                      <Sparkles size={14} aria-hidden="true" /> {p.highlight}
                    </p>
                  ) : (
                    // uniform cards keep the same room for the highlight, so every card lines up
                    look === 'uniform' && <p className="pj__highlight pj__highlight--empty" aria-hidden="true" />
                  )}
                  {config.techIcons ? (
                    <TechChips items={p.stack} max={look === 'uniform' ? 5 : 4} className="pj__stack" />
                  ) : (
                    <Chips items={p.stack} max={look === 'list' ? 6 : 4} small />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {rows && matching.length > rows * cols && (
          <SeeMore open={expanded} hidden={matching.length - rows * cols} onClick={() => setExpanded((e) => !e)} />
        )}
      </div>
    </section>
  );
}
