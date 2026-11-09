import {
  AppWindow,
  Award,
  BadgeCheck,
  Boxes,
  Milestone,
  Send,
  BrainCircuit,
  BriefcaseBusiness,
  FileText,
  FlaskConical,
  FolderCode,
  Globe,
  GraduationCap,
  LayoutGrid,
  Mail,
  Phone,
  Route,
  Server,
  Smartphone,
  SquareTerminal,
  Trophy,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { memo, type CSSProperties } from 'react';
import type { CareerType, CertificateKind, SocialKind } from '../content';
import { cx } from '../lib/env';
import type { SectionId } from './config';

/** One recognisable icon per section (also used by the navigation). */
export const SECTION_ICON: Record<SectionId, LucideIcon> = {
  about: UserRound,
  career: Route,
  projects: FolderCode,
  certificates: Award,
  contact: Mail,
};

/** Line icons used in the navigation when sections use the isometric icons. */
export const SECTION_ICON_ALT: Record<SectionId, LucideIcon> = {
  about: UserRound,
  career: Milestone,
  projects: Boxes,
  certificates: BadgeCheck,
  contact: Send,
};

export const CAREER_META: Record<CareerType, { label: string; Icon: LucideIcon }> = {
  study: { label: 'Study', Icon: GraduationCap },
  work: { label: 'Work', Icon: BriefcaseBusiness },
  research: { label: 'Research', Icon: FlaskConical },
  milestone: { label: 'Milestone', Icon: Trophy },
};

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  all: LayoutGrid,
  backend: Server,
  frontend: AppWindow,
  ai: BrainCircuit,
  mobile: Smartphone,
  systems: SquareTerminal,
};

export const CERT_META: Record<CertificateKind | 'all', { label: string; Icon: LucideIcon }> = {
  all: { label: 'All', Icon: LayoutGrid },
  course: { label: 'Courses', Icon: FileText },
  language: { label: 'Languages', Icon: Globe },
  award: { label: 'Awards & events', Icon: Trophy },
};

/**
 * The round "sticker" icon from version 01: a tinted disc with a white rim,
 * a soft drop shadow and a small tilt. `tone` picks the colour variable.
 * Memoised: when a list re-renders (a career step opens), unchanged icons are skipped.
 */
export const Sticker = memo(function Sticker({
  Icon,
  tone,
  size = 'md',
  tilt = true,
  className,
  style,
}: {
  Icon: LucideIcon;
  tone: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tilt?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cx('sticker', `sticker--${size}`, !tilt && 'sticker--flat', className)}
      style={{ '--c': tone, ...style } as CSSProperties}
      aria-hidden="true"
    >
      <Icon strokeWidth={2.1} />
    </span>
  );
});

export const sectionTone = (id: SectionId) => `var(--sec-${id})`;
export const careerTone = (type: CareerType) => `var(--type-${type})`;
export const categoryTone = (id: string) => `var(--cat-${id}, var(--accent))`;

// Lucide no longer ships brand logos, so GitHub and LinkedIn are drawn here.
function GithubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LinkedinMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="8.6" width="4.2" height="12.9" rx="0.6" />
      <circle cx="4.6" cy="4.6" r="2.35" />
      <path d="M9.1 8.6h4v1.8c.6-1.1 2-2.1 4.1-2.1 3.9 0 4.4 2.5 4.4 5.7v7.5h-4.2v-6.6c0-1.6-.1-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3v6.7H9.1z" />
    </svg>
  );
}

export function SocialIcon({ kind, size = 18 }: { kind: SocialKind; size?: number }) {
  switch (kind) {
    case 'github':
      return <GithubMark size={size} />;
    case 'linkedin':
      return <LinkedinMark size={size} />;
    case 'email':
      return <Mail size={size} aria-hidden="true" />;
    case 'phone':
      return <Phone size={size} aria-hidden="true" />;
    case 'resume':
      return <FileText size={size} aria-hidden="true" />;
    default:
      return <Globe size={size} aria-hidden="true" />;
  }
}
