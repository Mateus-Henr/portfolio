import '@fontsource-variable/jetbrains-mono';
import { LangProvider } from './i18n';
import { Page } from './site/Page';
import type { SiteConfig } from './site/config';
import { Scene } from './scene/Scene';
import './scene/theme.css';

/*
  Matt's portfolio: one page, in English and Brazilian Portuguese. The layout
  choices live in this config; the content comes from
  src/content/portfolio.json (English) and portfolio.pt-BR.json (Portuguese),
  and the interface texts from src/i18n/strings.ts.

  The style is white with violet and mint accents. The opening story, "The
  Architecture Machine", floats on the page with no frame; the navigation is
  a floating pill (a bottom bar on phones) with the language switch; the
  career path follows the scroll (on phones it is a minimal timeline
  instead); every project card has a small animation that plays on hover (on
  phones, as the card scrolls into view).
*/
const config: SiteConfig = {
  theme: 'v21',
  shell: 'top',
  nav: 'pill',
  navMobileBottom: true,
  brand: 'logo',
  hero: 'split',
  heroFlip: true,
  eyebrow: {
    en: 'Software Engineer · Brazil',
    pt: 'Engenheiro de Software · Brasil',
  },
  about: 'files',
  career: { layout: 'lanes', line: 'curve', order: 'newest', follow: 'scroll', filter: 'hide', steps: 5 },
  projects: { look: 'uniform', columns: 3, rows: 2, scenes: true },
  techIcons: true,
  certificates: 'grid',
  certificateRows: 3,
  contact: 'terminal-light',
  windowCards: true,
  sectionIcons: 'iso',
  centered: true,
  minimalFooter: true,
  labels: {
    en: {
      career: {
        title: 'From today, back to the start',
        intro: 'Today is at the top. Open any step to read more, and pick a kind of step to see only those.',
      },
    },
    pt: {
      career: {
        title: 'De hoje até o começo',
        intro: 'Hoje está no topo. Abra qualquer etapa para ler mais ou filtre por tipo.',
      },
    },
  },
};

export default function App() {
  return (
    <LangProvider>
      <Page config={config} scene={<Scene />} />
    </LangProvider>
  );
}
