import { useRef, useState, type CSSProperties } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import type { CertificateKind } from '../../content';
import { usePortfolio } from '../content';
import { cx } from '../../lib/env';
import { usePdfViewer } from '../../components/pdf/PdfViewer';
import { CERT_META, Sticker } from '../icons';
import { embedUrl, totalHours } from '../format';
import type { SiteConfig } from '../config';
import { Pills, SectionHead, SeeMore, useGridColumns, type PillOption } from '../ui';
import { TechGlyph, techColor } from '../tech';

const KINDS: (CertificateKind | 'all')[] = ['all', 'course', 'language', 'award'];
const TONE: Record<CertificateKind, string> = {
  course: 'var(--sec-certificates)',
  language: 'var(--type-research)',
  award: 'var(--type-milestone)',
};

export function Certificates({ config }: { config: SiteConfig }) {
  const portfolio = usePortfolio();
  const look = config.certificates;
  const rows = config.certificateRows;
  const viewer = usePdfViewer();
  const [kind, setKind] = useState<CertificateKind | 'all'>('all');
  const [expanded, setExpanded] = useState(false);
  const grid = useRef<HTMLUListElement>(null);
  const cols = useGridColumns(grid, kind);
  const certs = portfolio.certificates;
  const hours = Math.round(totalHours(certs));

  const options: PillOption[] = KINDS.map((k) => ({
    id: k,
    label: CERT_META[k].label,
    Icon: CERT_META[k].Icon,
    count: k === 'all' ? certs.length : certs.filter((c) => c.kind === k).length,
  }));

  const matching = certs.filter((c) => kind === 'all' || c.kind === kind);
  const limit = rows && !expanded ? rows * cols : Infinity;
  const shown = matching.slice(0, limit);

  return (
    <section id="certificates" className={cx('sec2', 'certs2', `certs2--${look}`)}>
      <div className="wrap">
        <SectionHead
          id="certificates"
          config={{
            ...config,
            labels: {
              ...config.labels,
              certificates: {
                intro: `${hours}+ hours of online courses, plus language certificates and awards. Open any certificate to see it.`,
                ...config.labels?.certificates,
              },
            },
          }}
        />
        <div className="certs2__menu" data-reveal>
          <Pills
            options={options}
            value={kind}
            onChange={(id) => {
              setKind(id as CertificateKind | 'all');
              setExpanded(false);
            }}
            label="Filter certificates"
          />
        </div>
        <ul className="certs2__grid" ref={grid} key={kind}>
          {shown.map((c, i) => {
            const src = embedUrl(c);
            const { Icon } = CERT_META[c.kind];
            return (
              <li key={c.id} className="cert2 card pj--in" style={{ '--tone': TONE[c.kind], '--i': i % 12 } as CSSProperties}>
                <div className="cert2__body">
                  {config.techIcons && c.tech ? (
                    <span className="cert2__tech" title={c.tech} style={{ '--brand': techColor(c.tech) } as CSSProperties}>
                      <TechGlyph name={c.tech} size={22} />
                    </span>
                  ) : (
                    <Sticker Icon={Icon} tone={TONE[c.kind]} size="sm" />
                  )}
                  <div className="cert2__text">
                    <h3 className="cert2__title">{c.title}</h3>
                    <p className="cert2__meta">
                      {c.issuer}
                      {c.hours ? ` · ${c.hours}` : ''}
                      {c.year ? ` · ${c.year}` : ''}
                    </p>
                  </div>
                  <div className="cert2__actions">
                    {src ? (
                      <button
                        type="button"
                        className="soft-btn"
                        onClick={() => viewer.open({ title: c.title, subtitle: `${c.issuer}${c.hours ? ` · ${c.hours}` : ''}`, src, href: c.file })}
                      >
                        <FileText size={15} aria-hidden="true" /> View
                      </button>
                    ) : c.file ? (
                      <a className="soft-btn" href={c.file} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} aria-hidden="true" /> Open
                      </a>
                    ) : (
                      c.course && (
                        <a className="soft-btn soft-btn--quiet" href={c.course} target="_blank" rel="noreferrer">
                          <ExternalLink size={15} aria-hidden="true" /> Course
                        </a>
                      )
                    )}
                  </div>
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
