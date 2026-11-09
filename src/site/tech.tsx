import { memo, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import {
  Blocks,
  Cloud,
  ChartSpline,
  Coffee,
  Cpu,
  Database,
  GitBranch,
  Globe,
  GraduationCap,
  Handshake,
  Languages,
  Layers,
  Network,
  Presentation,
  Repeat2,
  Route,
  Shapes,
  ShieldCheck,
  Sparkles,
  SquareKanban,
  Trophy,
  Users,
  Code2,
  type LucideIcon,
} from 'lucide-react';
import {
  siC,
  siClojure,
  siCss,
  siDocker,
  siExpress,
  siFirebase,
  siFlask,
  siGooglecloud,
  siGooglecolab,
  siHaystack,
  siHibernate,
  siHtml5,
  siJavascript,
  siJupyter,
  siKeycloak,
  siLangchain,
  siLinux,
  siMysql,
  siNodedotjs,
  siNumpy,
  siPandas,
  siPerplexity,
  siPostgresql,
  siProxmox,
  siPython,
  siPytorch,
  siReact,
  siRedis,
  siScikitlearn,
  siSpring,
  siSpringboot,
  siTypescript,
  type SimpleIcon,
} from 'simple-icons';
import { cx } from '../lib/env';

/*
  Brand icons for the tools named in portfolio.json, so people recognise a
  technology at a glance. Logos come from Simple Icons (CC0). Where a brand
  has no icon there, a neutral symbol in the brand's colour stands in, rather
  than an imitation of its logo.
*/

type Glyph = { brand: SimpleIcon; color: string } | { generic: LucideIcon; color: string };

const brand = (icon: SimpleIcon, color = `#${icon.hex}`): Glyph => ({ brand: icon, color });
const generic = (icon: LucideIcon, color: string): Glyph => ({ generic: icon, color });

const TECH: Record<string, Glyph> = {
  python: brand(siPython),
  langchain: brand(siLangchain, '#1c3c3c'),
  weaviate: generic(Database, '#00a67e'),
  flask: brand(siFlask, '#1f8a9c'),
  react: brand(siReact, '#149eca'),
  reactnative: brand(siReact, '#149eca'),
  redis: brand(siRedis),
  docker: brand(siDocker),
  haystack: brand(siHaystack),
  pytorch: brand(siPytorch),
  googlecolab: brand(siGooglecolab),
  pandas: brand(siPandas),
  scikitlearn: brand(siScikitlearn),
  seaborn: generic(ChartSpline, '#4c72b0'),
  numpy: brand(siNumpy),
  jupyter: brand(siJupyter),
  nodejs: brand(siNodedotjs),
  express: brand(siExpress),
  firebase: brand(siFirebase),
  openai: generic(Sparkles, '#10a37f'),
  perplexity: brand(siPerplexity),
  clojure: brand(siClojure),
  clojurescript: brand(siClojure),
  fulcro: generic(Layers, '#7b5ea7'),
  datomic: generic(Database, '#3f6fd8'),
  springboot: brand(siSpringboot),
  spring: brand(siSpring),
  hibernate: brand(siHibernate),
  postgresql: brand(siPostgresql),
  mysql: brand(siMysql),
  html: brand(siHtml5),
  html5: brand(siHtml5),
  css: brand(siCss),
  javascript: brand(siJavascript, '#c9a800'),
  typescript: brand(siTypescript),
  java: generic(Coffee, '#e76f00'),
  javafx: generic(Coffee, '#e76f00'),
  proxmox: brand(siProxmox),
  azuread: generic(ShieldCheck, '#0078d4'),
  azure: generic(Cloud, '#0078d4'),
  aws: generic(Cloud, '#ff9900'),
  googlecloud: brand(siGooglecloud),
  googlecloudrun: brand(siGooglecloud),
  cicd: generic(GitBranch, '#2f8cff'),
  keycloak: brand(siKeycloak, '#4d4d4d'),
  c: brand(siC, '#5c6bc0'),
  linux: brand(siLinux, '#1b1b1f'),
  tilaunchpad: generic(Cpu, '#cc0000'),
  embeddedsystems: generic(Cpu, '#cc0000'),
  blockchain: generic(Blocks, '#5b5f97'),
  architecture: generic(Network, '#6d4aff'),
  rbac: generic(ShieldCheck, '#13a37a'),
  webservices: generic(Globe, '#2f8cff'),
  designpatterns: generic(Shapes, '#f08c1a'),
  bpms: generic(Route, '#ff7a45'),
  // names as they appear in the skills list
  htmlcss: brand(siHtml5),
  clojurescriptfulcro: brand(siClojure),
  embeddedtilaunchpad: generic(Cpu, '#cc0000'),
  openaiapi: generic(Sparkles, '#10a37f'),
  // ways of working
  scrum: generic(Repeat2, '#6d4aff'),
  kanban: generic(SquareKanban, '#2f8cff'),
  xp: generic(Users, '#22b573'),
  clientmeetings: generic(Handshake, '#f08c1a'),
  // certificates
  verilog: generic(Cpu, '#7b5ea7'),
  english: generic(Languages, '#2f8cff'),
  award: generic(Trophy, '#f29e0c'),
  presentation: generic(Presentation, '#ff7a45'),
  teaching: generic(GraduationCap, '#22b573'),
  web: generic(Globe, '#2f8cff'),
};

const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Brand colour of a tool, for tinting things around its icon. */
export const techColor = (name: string) => TECH[key(name)]?.color ?? '#8a8a99';

export function TechGlyph({ name, size = 15 }: { name: string; size?: number }) {
  const glyph = TECH[key(name)];
  if (!glyph) return <Code2 size={size} strokeWidth={2.2} className="tech__glyph" style={{ color: '#8a8a99' }} aria-hidden="true" />;
  if ('brand' in glyph) {
    return (
      <svg className="tech__glyph" width={size} height={size} viewBox="0 0 24 24" fill={glyph.color} aria-hidden="true">
        <path d={glyph.brand.path} />
      </svg>
    );
  }
  const Icon = glyph.generic;
  return <Icon className="tech__glyph" size={size} strokeWidth={2.2} style={{ color: glyph.color }} aria-hidden="true" />;
}

function TechChip({ name }: { name: string }) {
  const glyph = TECH[key(name)];
  return (
    <li className="tchip" style={{ '--brand': glyph?.color ?? '#8a8a99' } as CSSProperties}>
      <TechGlyph name={name} />
      <span>{name}</span>
    </li>
  );
}

/** "+N": pressing it shows the tools it stands for in a small bubble above it. */
function MoreTools({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const root = useRef<HTMLLIElement>(null);
  const id = useId();

  // a tap anywhere else, or Escape, closes it
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const toggle = () => {
    // open towards the side of the list with more room
    const chip = root.current?.getBoundingClientRect();
    const list = root.current?.parentElement?.getBoundingClientRect();
    if (chip && list) setSide(chip.left + chip.width / 2 > list.left + list.width / 2 ? 'right' : 'left');
    setOpen((o) => !o);
  };

  return (
    <li className="tchip-more" ref={root}>
      <button
        type="button"
        className="tchip tchip--more"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${items.length} more: ${items.join(', ')}`}
        onClick={toggle}
      >
        +{items.length}
      </button>
      {open && (
        <ul className={cx('tchips', 'tchip-pop', `tchip-pop--${side}`)} id={id}>
          {items.map((item) => (
            <TechChip key={item} name={item} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Tools as chips with their brand icon and name (memoised: an unchanged list
 * is not re-rendered). With `max`, the rest hide behind a "+N" chip.
 */
export const TechChips = memo(function TechChips({ items, max, className }: { items: string[]; max?: number; className?: string }) {
  const shown = max ? items.slice(0, max) : items;
  const hidden = max ? items.slice(max) : [];
  return (
    <ul className={cx('tchips', className)}>
      {shown.map((item) => (
        <TechChip key={item} name={item} />
      ))}
      {hidden.length > 0 && <MoreTools items={hidden} />}
    </ul>
  );
});
