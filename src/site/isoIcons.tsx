import type { ReactNode } from 'react';
import type { SectionId } from './config';

/*
  Section icons as tiny isometric scenes, in the style of the opening city:
  each object stands on a small layered tile.
*/

const U = 9;
const CX = U * 0.866;
const SY = U * 0.5;
const ZU = U * 0.95;
const OX = 32;
const OY = 25;
type P3 = [number, number, number];
const iso = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * CX, OY + (x + y) * SY - z * ZU];
const poly = (ps: P3[]) => ps.map((p) => iso(...p).map((n) => n.toFixed(2)).join(',')).join(' ');

function Box({ b, c }: { b: [number, number, number, number, number, number]; c: [string, string, string] }) {
  const [x0, y0, z0, x1, y1, z1] = b;
  return (
    <g>
      <polygon points={poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])} fill={c[1]} />
      <polygon points={poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])} fill={c[2]} />
      <polygon points={poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])} fill={c[0]} />
    </g>
  );
}

function Tile() {
  const [sx, sy] = iso(3.4, 3.4, -0.5);
  return (
    <>
      <ellipse cx={sx} cy={sy + 2} rx={22} ry={3.2} fill="rgba(40,30,90,0.14)" />
      <Box b={[0, 0, -0.5, 3.4, 3.4, 0]} c={['#f4f1ff', '#ddd5fc', '#c8bcf7']} />
      <polygon points={poly([[0, 3.4, -0.18], [3.4, 3.4, -0.18], [3.4, 3.4, 0], [0, 3.4, 0]])} fill="#b9a8ff" />
      <polygon points={poly([[3.4, 0, -0.18], [3.4, 3.4, -0.18], [3.4, 3.4, 0], [3.4, 0, 0]])} fill="#a08cf5" />
    </>
  );
}

const VIOLET: [string, string, string] = ['#b4a3ff', '#7c5cff', '#5b3fd6'];
const MINT: [string, string, string] = ['#9af2db', '#22c3a6', '#169c85'];
const AMBER: [string, string, string] = ['#ffdc93', '#ffb02e', '#e8920c'];
const WHITE: [string, string, string] = ['#ffffff', '#f1edfd', '#ddd5f6'];

function About() {
  // a standing ID badge: band, photo circle, two lines
  const [ax, ay] = iso(1.1, 1.85, 1.45);
  return (
    <>
      <Tile />
      <Box b={[0.7, 1.6, 0, 2.7, 1.85, 2.7]} c={WHITE} />
      <polygon points={poly([[0.7, 1.85, 2.15], [2.7, 1.85, 2.15], [2.7, 1.85, 2.7], [0.7, 1.85, 2.7]])} fill="#7c5cff" />
      <ellipse cx={ax} cy={ay} rx={3.4} ry={4.2} fill="#ffb02e" />
      <circle cx={ax} cy={ay - 1.4} r={1.3} fill="#fff" opacity={0.85} />
      <polygon points={poly([[1.55, 1.85, 1.55], [2.5, 1.85, 1.55], [2.5, 1.85, 1.75], [1.55, 1.85, 1.75]])} fill="#c9bbff" />
      <polygon points={poly([[1.55, 1.85, 1.1], [2.3, 1.85, 1.1], [2.3, 1.85, 1.3], [1.55, 1.85, 1.3]])} fill="#e3dcff" />
      <polygon points={poly([[0.95, 1.85, 0.5], [2.45, 1.85, 0.5], [2.45, 1.85, 0.75], [0.95, 1.85, 0.75]])} fill="#22c3a6" />
    </>
  );
}

function Career() {
  // three steps going up, a flag on the top one
  const [fx, fy] = iso(2.75, 1.55, 1.95);
  return (
    <>
      <Tile />
      <Box b={[0.3, 1.0, 0, 1.25, 2.4, 0.65]} c={MINT} />
      <Box b={[1.25, 1.0, 0, 2.2, 2.4, 1.3]} c={VIOLET} />
      <Box b={[2.2, 1.0, 0, 3.15, 2.4, 1.95]} c={AMBER} />
      <path d={`M${fx} ${fy} V${fy - 15}`} stroke="#3b3a55" strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M${fx} ${fy - 15} l9 3 l-9 3 Z`} fill="#ff5c8a" />
    </>
  );
}

function Projects() {
  return (
    <>
      <Tile />
      <Box b={[0.45, 0.9, 0, 1.6, 2.05, 1.15]} c={VIOLET} />
      <Box b={[1.6, 0.9, 0, 2.75, 2.05, 1.15]} c={MINT} />
      <Box b={[1.0, 0.9, 1.15, 2.15, 2.05, 2.3]} c={AMBER} />
      <polygon points={poly([[1.25, 2.05, 1.5], [1.9, 2.05, 1.5], [1.9, 2.05, 1.95], [1.25, 2.05, 1.95]])} fill="#fff" opacity={0.55} />
    </>
  );
}

function Certificates() {
  // a medal: two ribbons and a gold disc with a star
  const [cx, cy] = iso(1.7, 1.7, 1.55);
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? 4.4 : 1.9;
    return `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
  return (
    <>
      <Tile />
      <path d={`M${cx - 9} ${cy - 20} L${cx - 2} ${cy - 3} L${cx + 3} ${cy - 5} L${cx - 3} ${cy - 20} Z`} fill="#7c5cff" />
      <path d={`M${cx + 9} ${cy - 20} L${cx + 2} ${cy - 3} L${cx - 3} ${cy - 5} L${cx + 3} ${cy - 20} Z`} fill="#ff5c8a" />
      <circle cx={cx} cy={cy + 1} r={9.6} fill="#e8920c" />
      <circle cx={cx} cy={cy} r={9.6} fill="#ffb02e" />
      <circle cx={cx} cy={cy} r={6.6} fill="#ffd36b" />
      <polygon points={star} fill="#fff" />
      <ellipse cx={cx} cy={iso(1.7, 1.7, 0)[1] - 1} rx={7} ry={2} fill="rgba(40,30,90,0.16)" />
    </>
  );
}

function Contact() {
  // an envelope on the tile and a paper plane taking off
  const [px, py] = iso(2.6, 0.5, 2.6);
  return (
    <>
      <Tile />
      <Box b={[0.55, 0.75, 0, 2.85, 2.6, 0.32]} c={WHITE} />
      <polyline points={poly([[0.55, 0.75, 0.33], [1.7, 1.7, 0.33], [0.55, 2.6, 0.33]])} fill="none" stroke="#c9bbff" strokeWidth={1.3} />
      <polyline points={poly([[2.85, 0.75, 0.33], [1.7, 1.7, 0.33], [2.85, 2.6, 0.33]])} fill="none" stroke="#c9bbff" strokeWidth={1.3} />
      <circle cx={iso(1.7, 1.7, 0.33)[0]} cy={iso(1.7, 1.7, 0.33)[1]} r={2.2} fill="#ff5c8a" />
      <path d={`M${px - 22} ${py + 14} C${px - 14} ${py + 10} ${px - 10} ${py + 6} ${px - 6} ${py + 2}`} fill="none" stroke="#b9adf5" strokeWidth={1.4} strokeDasharray="2 2.6" strokeLinecap="round" />
      <path d={`M${px - 6} ${py + 2} L${px + 11} ${py - 6} L${px + 3} ${py + 8} Z`} fill="#7c5cff" />
      <path d={`M${px - 6} ${py + 2} L${px + 11} ${py - 6} L${px + 0.5} ${py + 3.6} Z`} fill="#a996ff" />
    </>
  );
}

const ICONS: Record<SectionId, () => ReactNode> = {
  about: About,
  career: Career,
  projects: Projects,
  certificates: Certificates,
  contact: Contact,
};

export function IsoIcon({ id, size = 64 }: { id: SectionId; size?: number }) {
  const Icon = ICONS[id];
  return (
    <svg className="iso-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <Icon />
    </svg>
  );
}
