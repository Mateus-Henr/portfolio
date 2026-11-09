// Layout choices for one design version (11-21). Each version's index.tsx
// fills one of these; the Page component turns it into the full site.

import type { Portfolio } from '../content';
import { STRINGS, type Lang } from '../i18n';

export type SectionId = 'about' | 'career' | 'projects' | 'certificates' | 'contact';

export const SECTION_ORDER: SectionId[] = ['about', 'career', 'projects', 'certificates', 'contact'];

export type NavLook = 'pill' | 'dock' | 'tabs' | 'rail' | 'bar';
export type HeroLook = 'stacked' | 'split' | 'bento';
/** 'files': about-me.md and quick-facts side by side, skills.md below (version 21). */
export type AboutLook = 'window' | 'bento' | 'profile' | 'files';
export type CareerLayout = 'lanes' | 'zigzag' | 'rail';
export type CareerLine = 'curve' | 'metro' | 'circuit' | 'dotted' | 'stars';
export type ProjectsLook = 'grid' | 'list' | 'tiles' | 'uniform';
export type CertificatesLook = 'grid' | 'list';
export type ContactLook = 'window' | 'terminal' | 'terminal-light' | 'card';

export interface SectionText {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** Shorter label for the navigation. */
  nav?: string;
}

export interface SiteConfig {
  /** CSS class with the version's theme, e.g. "v11". */
  theme: string;
  /** "top": navigation above or below the page. "sidebar": a sticky profile column on the left. */
  shell: 'top' | 'sidebar';
  nav: NavLook;
  hero: HeroLook;
  heroAlign?: 'center' | 'left';
  /** Split hero only: put the animation on the left and the text on the right. */
  heroFlip?: boolean;
  /** Small line above the greeting, per language. */
  eyebrow?: Partial<Record<Lang, string>>;
  about: AboutLook;
  career: {
    layout: CareerLayout;
    line: CareerLine;
    /** "oldest": the path starts in 2019. "newest": it starts today. */
    order: 'oldest' | 'newest';
    /**
     * "button": a "Next step" button walks the path.
     * "scroll": a light follows the path as the page scrolls and the step in view is highlighted
     * (not on phones, where the path is a minimal timeline).
     */
    follow?: 'button' | 'scroll';
    /** What the Study / Work / Research / Milestone filters do to the other steps. */
    filter?: 'dim' | 'hide';
    /** How many steps show before "See more", on every screen (all of them when left out). */
    steps?: number;
  };
  projects: {
    look: ProjectsLook;
    columns?: 3 | 4;
    /** Rows shown before "See more" (all rows when left out). */
    rows?: number;
    /** A small animation on each card that plays while the cursor is over it (on phones, as it scrolls into view). */
    scenes?: boolean;
  };
  certificates: CertificatesLook;
  /** Rows of certificates shown before "See more" (all when left out). */
  certificateRows?: number;
  contact: ContactLook;
  /** Window chrome (traffic lights) on cards, as in version 04. */
  windowCards?: boolean;
  /** Brand icons next to each tool or course (projects, skills, career steps, courses). */
  techIcons?: boolean;
  /** What stands for Matt in the navigation: his face, an "M" monogram, or the face with his name. */
  brand?: 'portrait' | 'monogram' | 'logo';
  /** The pill navigation moves to the bottom centre on phones. */
  navMobileBottom?: boolean;
  /** Section heading icons: round stickers (01) or small isometric illustrations. */
  sectionIcons?: 'sticker' | 'iso';
  /** Centre section titles and filter menus. */
  centered?: boolean;
  /** Section texts that replace the defaults (src/i18n/strings.ts), per language. */
  labels?: Partial<Record<Lang, Partial<Record<SectionId, SectionText>>>>;
  footer?: string;
  /** Footer with only "© year Name". */
  minimalFooter?: boolean;
  /** Content for this version only (defaults to src/content/portfolio.json). */
  content?: Portfolio;
}

/** A section's eyebrow, title, intro and navigation label in one language. */
export function sectionText(config: SiteConfig, id: SectionId, lang: Lang): SectionText & { eyebrow: string; title: string; nav: string } {
  return { ...STRINGS[lang].sections[id], ...config.labels?.[lang]?.[id] };
}
