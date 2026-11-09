import '@fontsource-variable/jetbrains-mono';
import { Page } from './site/Page';
import type { SiteConfig } from './site/config';
import { Scene } from './scene/Scene';
import './scene/theme.css';

/*
  Matt's portfolio: one page. The layout choices live in this config; every
  text on the page comes from src/content/portfolio.json.

  The style is white with violet and mint accents. The opening story, "The
  Architecture Machine", floats on the page with no frame; the navigation is
  a floating pill (a bottom bar on phones); the career path follows the
  scroll (on phones it is a minimal timeline instead); every project card
  has a small animation that plays on hover (on phones, as the card scrolls
  into view).
*/
const config: SiteConfig = {
  theme: 'v21',
  shell: 'top',
  nav: 'pill',
  navMobileBottom: true,
  brand: 'logo',
  hero: 'split',
  heroFlip: true,
  eyebrow: 'Software Engineer · Brazil',
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
    career: {
      title: 'From today, back to the start',
      intro: 'Today is at the top. Open any step to read more, and pick a kind of step to see only those.',
    },
  },
};

export default function App() {
  return <Page config={config} scene={<Scene />} />;
}
