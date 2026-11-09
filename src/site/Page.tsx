import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../lib/env';
import { useReveal } from '../lib/hooks';
import { PdfViewerProvider } from '../components/pdf/PdfViewer';
import { contentFor } from '../content';
import { useLang } from '../i18n';
import { ContentProvider } from './content';
import type { SiteConfig } from './config';
import { Hero } from './Hero';
import { Nav, Sidebar } from './Nav';
import { About } from './sections/About';
import { CareerPath } from './sections/CareerPath';
import { Certificates } from './sections/Certificates';
import { Contact, Footer } from './sections/Contact';
import { Projects } from './sections/Projects';
import './styles/site.css';
import './styles/sections.css';
import './styles/career.css';
import './styles/features.css';

/**
 * One full portfolio page for versions 11-20: navigation, the greeting with
 * the animated story, and every section. Each version passes its own scene
 * and layout choices; colours and fonts come from its theme class.
 */
export function Page({ config, scene }: { config: SiteConfig; scene: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  useReveal(root);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.nav = config.shell === 'sidebar' ? 'sidebar' : config.nav;
    if (config.navMobileBottom) html.dataset.navMobile = 'bottom';
    return () => {
      delete html.dataset.nav;
      delete html.dataset.navMobile;
    };
  }, [config.nav, config.shell, config.navMobileBottom]);

  return (
    <div ref={root} className={cx('site', config.theme, `shell--${config.shell}`, `nav--${config.nav}`, config.centered && 'site--centered')}>
      <ContentProvider value={config.content ?? contentFor(lang)}>
      <PdfViewerProvider look="window">
        {config.shell === 'sidebar' ? <Sidebar config={config} /> : <Nav config={config} />}
        <div className="site__col">
          <main className="site__main">
            <Hero config={config} scene={scene} />
            <About config={config} />
            <CareerPath config={config} />
            <Projects config={config} />
            <Certificates config={config} />
            <Contact config={config} />
          </main>
          <Footer config={config} />
        </div>
      </PdfViewerProvider>
      </ContentProvider>
    </div>
  );
}
