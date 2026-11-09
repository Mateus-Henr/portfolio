import { useRef, type ReactNode, type SVGProps } from 'react';
import { gsap, useGSAP } from '../lib/motion';
import { SHOTS, isPhone, prefersReducedMotion } from '../lib/env';

/*
  One small isometric scene per project, drawn like the opening city.
  The card shows the finished scene. While the cursor is over the card the
  scene plays its little story (on touch screens, a tap plays it; on phones
  it also plays once as the card scrolls into view). Every story clears part
  of the drawing first and ends exactly on the finished picture drawn here,
  which is also the resting frame.
*/

// ---------- tiny isometric kit ----------
const MU = 14;
const MC = MU * 0.866;
const MS = MU * 0.5;
const MZ = MU * 0.95;
const MOX = 180;
const MOY = 30;
type P2 = [number, number];
type P3 = [number, number, number];
type Six = [number, number, number, number, number, number];
type C3 = [string, string, string];
type Q = (selector: string) => Element[];
type Tl = gsap.core.Timeline;

interface Scene {
  art: ReactNode;
  play: (tl: Tl, q: Q) => void;
}

const m = (x: number, y: number, z = 0): P2 => [MOX + (x - y) * MC, MOY + (x + y) * MS - z * MZ];
const mp = (ps: P3[]) => ps.map((p) => m(...p).map((n) => n.toFixed(1)).join(',')).join(' ');
const pt = (p: P2) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const up = (p: P2, dy: number): P2 => [p[0], p[1] - dy];
const origin = (el: Element) => (el as SVGElement).dataset.o ?? '0 0';

const VIOLET: C3 = ['#b4a3ff', '#7c5cff', '#5b3fd6'];
const MINT: C3 = ['#9af2db', '#22c3a6', '#169c85'];
const AMBER: C3 = ['#ffdc93', '#ffb02e', '#e8920c'];
const PINK: C3 = ['#ffb3c8', '#ff5c8a', '#e0436f'];
const BLUE: C3 = ['#c3e6ff', '#4aa8ff', '#2f86e0'];
const WHITE: C3 = ['#ffffff', '#f1edfd', '#ddd5f6'];
const DARK: C3 = ['#4a4c6b', '#2b2d42', '#1f2033'];
const NAVY: C3 = ['#2d3047', '#23253a', '#1b1d2e'];
const GREY: C3 = ['#eef0f5', '#c9cfdc', '#b5bccc'];
const PLATE: C3 = ['#f4f1ff', '#ddd5fc', '#c8bcf7'];
const GRASS: C3 = ['#b8ecb0', '#c99a6c', '#b2855a'];

function Bx({ b, c, ...rest }: { b: Six; c: C3 } & SVGProps<SVGGElement>) {
  const [x0, y0, z0, x1, y1, z1] = b;
  return (
    <g {...rest}>
      <polygon points={mp([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])} fill={c[1]} />
      <polygon points={mp([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])} fill={c[2]} />
      <polygon points={mp([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])} fill={c[0]} />
    </g>
  );
}

/** A rectangle on a wall facing front-left (plane "y") or front-right (plane "x"). */
function Face({ plane, at, a0, a1, z0, z1, ...rest }: { plane: 'x' | 'y'; at: number; a0: number; a1: number; z0: number; z1: number } & SVGProps<SVGPolygonElement>) {
  const pts: P3[] =
    plane === 'y'
      ? [[a0, at, z0], [a1, at, z0], [a1, at, z1], [a0, at, z1]]
      : [[at, a0, z0], [at, a1, z0], [at, a1, z1], [at, a0, z1]];
  return <polygon points={mp(pts)} {...rest} />;
}

/** A rectangle lying flat at height z. */
function Flat({ x0, y0, x1, y1, z = 0.01, ...rest }: { x0: number; y0: number; x1: number; y1: number; z?: number } & SVGProps<SVGPolygonElement>) {
  return <polygon points={mp([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]])} {...rest} />;
}

/** A line through screen points. */
function Path({ pts, ...rest }: { pts: P2[] } & SVGProps<SVGPathElement>) {
  return <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join(' ')} fill="none" strokeLinecap="round" strokeLinejoin="round" {...rest} />;
}

/** The pedestal every scene stands on: a slab over a dark base, like the layers of the opening city. */
function Base({ top = PLATE, band = ['#b9a8ff', '#a08cf5'] }: { top?: C3; band?: [string, string] }) {
  const [sx, sy] = m(5.8, 5.8, -1);
  return (
    <>
      <ellipse cx={sx} cy={sy + 2} rx={84} ry={5.5} fill="rgba(40,30,90,0.12)" />
      <Bx b={[0.2, 0.2, -1, 5.8, 5.8, -0.5]} c={NAVY} />
      <Bx b={[0, 0, -0.5, 6, 6, 0]} c={top} />
      <Face plane="y" at={6} a0={0} a1={6} z0={-0.14} z1={0} fill={band[0]} />
      <Face plane="x" at={6} a0={0} a1={6} z0={-0.14} z1={0} fill={band[1]} />
    </>
  );
}

/** Moves its children to a screen point, so they can be animated from there. */
function At({ p, children }: { p: P2; children: ReactNode }) {
  return <g transform={`translate(${pt(p)})`}>{children}</g>;
}

function Windows({ b, c, start = 0.25, step = 0.45, col = 0.34 }: { b: Six; c: [string, string]; start?: number; step?: number; col?: number }) {
  const [x0, y0, z0, x1, y1, z1] = b;
  const out: ReactNode[] = [];
  for (let z = z0 + start; z + 0.2 <= z1 - 0.1; z += step) {
    for (let x = x0 + 0.15; x + col * 0.6 <= x1 - 0.08; x += col) {
      out.push(<Face key={`l${x.toFixed(2)}-${z.toFixed(2)}`} plane="y" at={y1} a0={x} a1={x + col * 0.55} z0={z} z1={z + 0.2} fill={c[0]} />);
    }
    for (let y = y0 + 0.15; y + col * 0.6 <= y1 - 0.08; y += col) {
      out.push(<Face key={`r${y.toFixed(2)}-${z.toFixed(2)}`} plane="x" at={x1} a0={y} a1={y + col * 0.55} z0={z} z1={z + 0.2} fill={c[1]} />);
    }
  }
  return <g>{out}</g>;
}

/** A house with a pitched roof, as in the opening city. */
function House({ x0, y0, x1, y1, h, roof }: { x0: number; y0: number; x1: number; y1: number; h: number; roof: [string, string] }) {
  const ym = (y0 + y1) / 2;
  const rh = 0.5;
  return (
    <g>
      <polygon points={mp([[x0, y0, h], [x1, y0, h], [x1, ym, h + rh], [x0, ym, h + rh]])} fill={roof[1]} />
      <polygon points={mp([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]])} fill="#fbefe2" />
      <polygon points={mp([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]])} fill="#eadbc9" />
      <Face plane="y" at={y1} a0={x0 + 0.3} a1={x0 + 0.52} z0={0} z1={0.4} fill="#6d4aff" />
      <Face plane="x" at={x1} a0={y0 + 0.25} a1={y0 + 0.5} z0={0.26} z1={0.48} fill="#ffe7a8" />
      <polygon points={mp([[x1, y0, h], [x1, y1, h], [x1, ym, h + rh]])} fill="#eadbc9" />
      <polygon points={mp([[x0, y1, h], [x1, y1, h], [x1, ym, h + rh], [x0, ym, h + rh]])} fill={roof[0]} />
    </g>
  );
}

function Tree({ x, y, r = 4.6, c = '#3cbf86' }: { x: number; y: number; r?: number; c?: string }) {
  const [tx, ty] = m(x, y, 0);
  return (
    <g>
      <ellipse cx={tx} cy={ty} rx={r * 0.8} ry={r * 0.35} fill="rgba(20,60,40,0.18)" />
      <rect x={tx - 1.2} y={ty - r * 1.2} width={2.4} height={r * 1.2} rx={1} fill="#8a5a3c" />
      <circle cx={tx} cy={ty - r * 1.65} r={r} fill={c} />
      <circle cx={tx - r * 0.35} cy={ty - r * 1.95} r={r * 0.4} fill="#fff" opacity={0.2} />
    </g>
  );
}

/** A folder: a box with a tab on top. */
function Folder({ x, y, c, ...rest }: { x: number; y: number; c: C3 } & SVGProps<SVGGElement>) {
  return (
    <g {...rest}>
      <Bx b={[x, y, 0, x + 1.1, y + 1.1, 0.55]} c={c} />
      <Bx b={[x, y, 0.55, x + 0.45, y + 0.45, 0.64]} c={c} />
    </g>
  );
}

function Envelope() {
  return (
    <g>
      <rect x={-7} y={-5} width={14} height={10} rx={2} fill="#fff" stroke="#5b3fd6" strokeWidth={1.3} />
      <path d="M-6 -4 L0 1 L6 -4" fill="none" stroke="#5b3fd6" strokeWidth={1.2} />
    </g>
  );
}

function Check({ r = 7, fill = '#22c3a6' }: { r?: number; fill?: string }) {
  return (
    <g>
      <circle r={r} fill={fill} />
      <path d={`M${-r * 0.45} 0 L${-r * 0.1} ${r * 0.35} L${r * 0.5} ${-r * 0.35}`} fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Sheet() {
  return (
    <g>
      <rect x={-5.5} y={-7} width={11} height={14} rx={1.5} fill="#fff" stroke="#9a8fd0" strokeWidth={1} />
      <path d="M-3 -3.5 H3 M-3 -0.5 H3 M-3 2.5 H1" stroke="#c9c0f0" strokeWidth={1.1} />
    </g>
  );
}

function Lock({ fill = '#b8bfcd', ...rest }: { fill?: string } & SVGProps<SVGCircleElement>) {
  return (
    <g>
      <circle r={6} fill={fill} {...rest} />
      <rect x={-2.8} y={-0.8} width={5.6} height={4.2} rx={1} fill="#fff" />
      <path d="M-1.7 -0.8 v-1.6 a1.7 1.7 0 0 1 3.4 0 v1.6" fill="none" stroke="#fff" strokeWidth={1.2} />
    </g>
  );
}

/** A small label in a rounded pill. */
function Tag({ p, text, fill = '#fff', color = '#2b2d42', w }: { p: P2; text: string; fill?: string; color?: string; w?: number }) {
  const width = w ?? text.length * 4.6 + 10;
  return (
    <g>
      <rect x={p[0] - width / 2} y={p[1] - 6.5} width={width} height={13} rx={6.5} fill={fill} stroke="rgba(40,30,90,0.12)" strokeWidth={0.8} />
      <text x={p[0]} y={p[1] + 2.6} textAnchor="middle" className="pjsc-t pjsc-t--s" fill={color}>
        {text}
      </text>
    </g>
  );
}

// ---------- timeline helpers ----------
const hide = (tl: Tl, targets: gsap.TweenTarget, at = 0) => tl.to(targets, { autoAlpha: 0, duration: 0.2 }, at);

const pop = (tl: Tl, targets: gsap.TweenTarget, at: number, stagger = 0) => {
  tl.set(targets, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, at);
  tl.to(targets, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)', stagger }, at);
};

/** Flies an element (drawn at `from`) along an arc to `to`, then hides it. */
const fly = (tl: Tl, el: Element, from: P2, to: P2, at: number, duration = 0.7, lift = 28) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  tl.set(el, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, at);
  tl.to(el, { motionPath: { path: [{ x: 0, y: 0 }, { x: dx / 2, y: dy / 2 - lift }, { x: dx, y: dy }], curviness: 1.2 }, duration, ease: 'power1.inOut' }, at);
  tl.to(el, { autoAlpha: 0, duration: 0.14 }, at + duration);
};

/** Moves an element (drawn at the first point) through a list of points, then hides it. */
const route = (tl: Tl, el: Element, pts: P2[], at: number, duration: number, curviness = 0) => {
  const [x0, y0] = pts[0];
  tl.set(el, { autoAlpha: 1, x: 0, y: 0 }, at);
  tl.to(el, { motionPath: { path: pts.map(([x, y]) => ({ x: x - x0, y: y - y0 })), curviness }, duration, ease: 'none' }, at);
  tl.to(el, { autoAlpha: 0, duration: 0.12 }, at + duration);
};

const hop = (tl: Tl, el: Element, at: number) => tl.to(el, { y: -9, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, at);
const end = (tl: Tl, at: number) => tl.set({}, {}, at);

// ---------- 1. citizen requests: letters go from homes to City Hall ----------
const CH_DOME = m(4.5, 1.5, 1.15);
const CH_FROM: P2[] = [m(0.96, 2.0, 0.22), m(0.96, 5.0, 0.22), m(4.4, 5.1, 0.2)];

function CityHall() {
  const [dx, dy] = CH_DOME;
  const r = 8.5;
  const cols: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 3.85 + i * 0.3;
    cols.push(<Face key={`l${i}`} plane="y" at={2.3} a0={x} a1={x + 0.09} z0={0.08} z1={0.62} fill="#d9d1f5" />);
    const y = 0.85 + i * 0.3;
    cols.push(<Face key={`r${i}`} plane="x" at={5.3} a0={y} a1={y + 0.09} z0={0.08} z1={0.62} fill="#c8bdf0" />);
  }
  return (
    <g>
      <Bx b={[3.7, 0.7, 0, 5.3, 2.3, 0.75]} c={['#ffffff', '#f4f1fd', '#e4def6']} />
      {cols}
      <Bx b={[4.1, 1.1, 0.75, 4.9, 1.9, 1.15]} c={WHITE} />
      <path data-a="dome" d={`M${dx - r} ${dy} A${r} ${r * 1.05} 0 0 1 ${dx + r} ${dy} A${r} ${r * 0.5} 0 0 1 ${dx - r} ${dy} Z`} fill="#6d4aff" />
      <path d={`M${dx - r * 0.55} ${dy - r * 0.6} A${r * 0.7} ${r * 0.7} 0 0 1 ${dx} ${dy - r * 1.02}`} fill="none" stroke="#a996ff" strokeWidth={1.4} strokeLinecap="round" />
      <path d={`M${dx} ${dy - r} V${dy - r - 13}`} stroke="#3b3a55" strokeWidth={1.2} />
      <path d={`M${dx} ${dy - r - 13} l8 2.6 l-8 2.6 Z`} fill="#ff5c8a" />
    </g>
  );
}

const cityHall: Scene = {
  art: (
    <>
      <Base top={GRASS} band={['#86cf79', '#6fbd63']} />
      <Flat x0={0} y0={2.75} x1={6} y1={3.25} fill="#e4e7ef" />
      <Flat x0={2.75} y0={0} x1={3.25} y1={6} fill="#e4e7ef" />
      <House x0={0.55} y0={0.6} x1={1.95} y1={2.0} h={0.7} roof={['#ff5c8a', '#d9466f']} />
      <Tree x={2.35} y={0.45} />
      <Tree x={0.45} y={2.4} r={4} c="#4cc38a" />
      <CityHall />
      <House x0={0.55} y0={3.6} x1={1.95} y1={5.0} h={0.65} roof={['#ffb02e', '#e8920c']} />
      <Tree x={5.55} y={3.55} r={4.2} c="#2fae74" />
      <Tree x={2.35} y={5.55} r={4} />
      <Bx b={[3.7, 3.7, 0, 5.1, 5.1, 1.25]} c={MINT} />
      <Windows b={[3.7, 3.7, 0, 5.1, 5.1, 1.25]} c={['#e6fffa', '#bdf5e8']} start={0.5} />
      <Face plane="y" at={5.1} a0={4.25} a1={4.55} z0={0} z1={0.36} fill="#169c85" />
      {CH_FROM.map((p, i) => (
        <At key={i} p={p}>
          <g data-a="env" opacity={0}>
            <Envelope />
          </g>
        </At>
      ))}
      <At p={[CH_DOME[0] + 17, CH_DOME[1] - 21]}>
        <g data-a="ok">
          <Check />
        </g>
      </At>
      <g>
        <rect x={12} y={16} width={86} height={22} rx={11} fill="#fff" stroke="#e8e3f7" />
        <text x={22} y={30.5} className="pjsc-t">Requests</text>
        {[72, 80, 88].map((x) => (
          <circle key={x} data-a="dot" cx={x} cy={27} r={3} fill="#22c3a6" />
        ))}
      </g>
    </>
  ),
  play: (tl, q) => {
    const dots = q('[data-a="dot"]');
    const dome = q('[data-a="dome"]');
    hide(tl, q('[data-a="ok"]'));
    tl.to(dots, { fill: '#ddd6f3', duration: 0.2 }, 0);
    q('[data-a="env"]').forEach((env, i) => {
      const t = 0.3 + i * 0.5;
      fly(tl, env, CH_FROM[i], up(CH_DOME, 4), t, 0.8, 30);
      tl.to(dots[i], { fill: '#22c3a6', duration: 0.15 }, t + 0.8);
      tl.to(dome, { fill: '#9c85ff', duration: 0.12, yoyo: true, repeat: 1 }, t + 0.78);
    });
    pop(tl, q('[data-a="ok"]'), 2.2);
    end(tl, 3.0);
  },
};

// ---------- 2. document chatbot: pages feed the answer ----------
const RC_DOCS = m(1.25, 4.75, 0.5);
const RC_SCREEN = m(3.0, 1.4, 1.2);

const ragChatbot: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[1.4, 1.2, 0, 5.6, 1.4, 3.0]} c={WHITE} />
      <Face plane="y" at={1.4} a0={1.4} a1={5.6} z0={2.72} z1={3.0} fill="#7c5cff" />
      <Face data-a="qb" plane="y" at={1.4} a0={3.5} a1={5.35} z0={2.12} z1={2.45} fill="#e3dcff" />
      <g data-a="ans">
        <Face plane="y" at={1.4} a0={1.65} a1={4.3} z0={0.55} z1={1.78} fill="#7c5cff" />
        <Face plane="y" at={1.4} a0={1.85} a1={4.0} z0={1.46} z1={1.55} fill="#fff" />
        <Face plane="y" at={1.4} a0={1.85} a1={3.7} z0={1.23} z1={1.32} fill="#fff" />
        <Face plane="y" at={1.4} a0={1.85} a1={3.25} z0={1.0} z1={1.09} fill="#fff" />
        <Face plane="y" at={1.4} a0={1.85} a1={2.9} z0={0.77} z1={0.86} fill="#fff" />
      </g>
      <g data-a="dots" opacity={0}>
        {[0, 1, 2].map((k) => {
          const [x, y] = m(2.0 + k * 0.32, 1.4, 1.1);
          return <circle key={k} cx={x} cy={y} r={1.7} fill="#7c5cff" />;
        })}
      </g>
      <Bx b={[0.4, 3.9, 0, 2.1, 5.6, 0.12]} c={['#ffffff', '#ece8fb', '#dcd5f6']} />
      <Bx b={[0.4, 3.9, 0.16, 2.1, 5.6, 0.28]} c={['#ffffff', '#ece8fb', '#dcd5f6']} />
      <Bx b={[0.4, 3.9, 0.32, 2.1, 5.6, 0.44]} c={['#ffffff', '#ece8fb', '#dcd5f6']} />
      <Flat x0={0.7} y0={4.25} x1={1.85} y1={4.37} z={0.45} fill="#c9c0f0" />
      <Flat x0={0.7} y0={4.6} x1={1.55} y1={4.72} z={0.45} fill="#c9c0f0" />
      <Flat x0={0.7} y0={4.95} x1={1.75} y1={5.07} z={0.45} fill="#c9c0f0" />
      <Flat x0={0.4} y0={3.9} x1={0.75} y1={4.15} z={0.45} fill="#ff4d6d" />
      {[0, 1, 2].map((i) => (
        <At key={i} p={RC_DOCS}>
          <g data-a="page" opacity={0}>
            <Sheet />
          </g>
        </At>
      ))}
      <g data-a="badge">
        <rect x={262} y={16} width={86} height={22} rx={11} fill="#22c3a6" />
        <text x={305} y={30.5} textAnchor="middle" className="pjsc-t" fill="#fff">
          +30% match
        </text>
      </g>
    </>
  ),
  play: (tl, q) => {
    hide(tl, [q('[data-a="ans"]'), q('[data-a="badge"]'), q('[data-a="qb"]')]);
    pop(tl, q('[data-a="qb"]'), 0.25);
    q('[data-a="page"]').forEach((page, i) => {
      const t = 0.55 + i * 0.25;
      tl.set(page, { rotation: 0, transformOrigin: '50% 50%' }, t);
      fly(tl, page, RC_DOCS, RC_SCREEN, t, 0.7, 30);
      tl.to(page, { rotation: 20, duration: 0.7, ease: 'none' }, t);
    });
    tl.to(q('[data-a="dots"]'), { autoAlpha: 1, duration: 0.12, yoyo: true, repeat: 3 }, 1.5);
    tl.to(q('[data-a="ans"]'), { autoAlpha: 1, duration: 0.35 }, 2.0);
    pop(tl, q('[data-a="badge"]'), 2.35);
    end(tl, 3.2);
  },
};

// ---------- 3. RAG benchmark: six parts measured, one wins ----------
const RB_H = [1.0, 1.6, 1.25, 2.3, 1.45, 1.85];
const RB_C = [VIOLET, MINT, BLUE, AMBER, PINK, VIOLET];

const ragBenchmark: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[0.3, 1.95, 0, 5.7, 2.85, 0.06]} c={['#ffffff', '#e7e1fb', '#d6ccf6']} />
      {RB_H.map((h, i) => {
        const x0 = 0.45 + i * 0.88;
        return <Bx key={i} data-a="bar" data-o={pt(m(x0 + 0.58, 2.7, 0.06))} b={[x0, 2.1, 0.06, x0 + 0.58, 2.7, 0.06 + h]} c={RB_C[i]} />;
      })}
      <At p={up(m(3.38, 2.4, 2.36), 13)}>
        <path data-a="star" d="M0 -8 L2.3 -2.6 L8 -2.6 L3.4 1 L5.2 7 L0 3.4 L-5.2 7 L-3.4 1 L-8 -2.6 L-2.3 -2.6 Z" fill="#ffb02e" stroke="#e8920c" strokeWidth={1} />
      </At>
      <text x={14} y={34} className="pjsc-t pjsc-t--big">20 LLMs</text>
      <text x={14} y={48} className="pjsc-t pjsc-t--muted">6 parts measured</text>
    </>
  ),
  play: (tl, q) => {
    const bars = q('[data-a="bar"]');
    hide(tl, q('[data-a="star"]'));
    bars.forEach((b) => tl.to(b, { scaleY: 0.04, duration: 0.25, ease: 'power2.in', svgOrigin: origin(b) }, 0));
    bars.forEach((b, i) => tl.to(b, { scaleY: 1, duration: 0.55, ease: 'back.out(1.6)', svgOrigin: origin(b) }, 0.4 + i * 0.15));
    pop(tl, q('[data-a="star"]'), 1.55);
    tl.to(q('[data-a="star"]'), { rotation: 360, duration: 0.6, transformOrigin: '50% 50%' }, 1.65);
    end(tl, 2.8);
  },
};

// ---------- 4. energy anomaly: a 3 a.m. spike is caught and the lights go off ----------
const energyAnomaly: Scene = {
  art: (
    <>
      <Base />
      <path d="M30 18 a9 9 0 1 0 10 13 a7 7 0 1 1 -10 -13 Z" fill="#ffd36b" />
      <Path pts={[m(2.6, 2.3, 0.01), m(3.3, 2.3, 0.01), m(3.3, 4.1, 0.01), m(3.8, 4.1, 0.01)]} stroke="#3b3a55" strokeWidth={1.5} />
      <Bx b={[0.6, 0.8, 0, 2.6, 2.8, 2.1]} c={WHITE} />
      <Face plane="y" at={2.8} a0={0.6} a1={2.6} z0={1.92} z1={2.1} fill="#b9a8ff" />
      <Face plane="x" at={2.6} a0={0.8} a1={2.8} z0={1.92} z1={2.1} fill="#a08cf5" />
      <g data-a="win">
        <Windows b={[0.6, 0.8, 0, 2.6, 2.8, 1.9]} c={['#ffd36b', '#f5c24f']} start={0.5} />
      </g>
      <Face plane="y" at={2.8} a0={1.45} a1={1.75} z0={0} z1={0.36} fill="#7c5cff" />
      <Tree x={4.7} y={1.2} />
      <Tree x={5.4} y={2.1} r={3.8} c="#4cc38a" />
      <Bx b={[3.8, 3.7, 0, 4.6, 4.5, 0.85]} c={NAVY} />
      <Face plane="y" at={4.5} a0={3.95} a1={4.45} z0={0.45} z1={0.7} fill="#7cf2d0" />
      <At p={m(4.6, 4.1, 0.42)}>
        <path d="M1 -5 L-2.5 0.5 H0.5 L-1 5 L2.8 -0.8 H-0.2 Z" fill="#ffd36b" />
      </At>
      <Tree x={1.2} y={4.7} r={4.2} />
      <g>
        <rect x={258} y={18} width={94} height={64} rx={10} fill="#fff" stroke="#e3dcff" />
        <text x={266} y={31} className="pjsc-t pjsc-t--s pjsc-t--muted">kWh</text>
        <path d="M266 70 H344 M266 54 H344 M266 38 H344" stroke="#f0edf9" strokeWidth={1} />
        <path data-a="line" d="M266 68 C276 62 284 54 294 58 C302 61 308 64 316 62 L322 28 L328 63 C334 64 340 60 344 58" fill="none" stroke="#22c3a6" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        <g data-a="tag">
          <text x={316} y={33} textAnchor="end" className="pjsc-t pjsc-t--s" fill="#ff4d6d">
            3 a.m.
          </text>
        </g>
        <circle data-a="spike" cx={322} cy={28} r={3.8} fill="#ff4d6d" stroke="#fff" strokeWidth={1.3} />
      </g>
      <At p={[348, 20]}>
        <g data-a="ok">
          <Check r={6.5} />
        </g>
      </At>
    </>
  ),
  play: (tl, q) => {
    hide(tl, [q('[data-a="spike"]'), q('[data-a="ok"]'), q('[data-a="tag"]')]);
    tl.to(q('[data-a="line"]'), { drawSVG: '0%', duration: 0.2 }, 0);
    tl.to(q('[data-a="line"]'), { drawSVG: '100%', duration: 1.3, ease: 'none' }, 0.25);
    pop(tl, q('[data-a="spike"]'), 1.15);
    tl.to(q('[data-a="tag"]'), { autoAlpha: 1, duration: 0.2 }, 1.25);
    tl.to(q('[data-a="spike"]'), { scale: 1.5, duration: 0.16, yoyo: true, repeat: 3, transformOrigin: '50% 50%' }, 1.5);
    tl.to(q('[data-a="win"]'), { opacity: 0.12, duration: 0.45 }, 2.2);
    pop(tl, q('[data-a="ok"]'), 2.5);
    tl.to(q('[data-a="win"]'), { opacity: 1, duration: 0.3 }, 3.3);
    end(tl, 3.6);
  },
};

// ---------- 5. battle cards: two brands compared, with data gathered by AI ----------
const BC_A: [number, number][] = [[1.7, 1.5], [1.15, 1.0], [0.6, 1.7]];
const BC_B: [number, number][] = [[1.7, 1.2], [1.15, 1.7], [0.6, 0.9]];

const battleCards: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[0.4, 2.7, 0, 2.6, 2.9, 2.4]} c={WHITE} />
      <Face plane="y" at={2.9} a0={0.4} a1={2.6} z0={2.1} z1={2.4} fill="#7c5cff" />
      {BC_A.map(([z, len], i) => (
        <Path key={i} data-a="bar" pts={[m(0.65, 2.9, z), m(0.65 + len, 2.9, z)]} stroke="#7c5cff" strokeWidth={4} />
      ))}
      <Bx b={[2.7, 0.4, 0, 2.9, 2.6, 2.4]} c={WHITE} />
      <Face plane="x" at={2.9} a0={0.4} a1={2.6} z0={2.1} z1={2.4} fill="#ffb02e" />
      {BC_B.map(([z, len], i) => (
        <Path key={i} data-a="bar" pts={[m(2.9, 2.35, z), m(2.9, 2.35 - len, z)]} stroke="#ffb02e" strokeWidth={4} />
      ))}
      <At p={m(3.3, 3.3, 1.3)}>
        <g data-a="vs">
          <circle r={9.5} fill="#23233a" />
          <text y={3.4} textAnchor="middle" className="pjsc-t" fill="#fff">
            VS
          </text>
        </g>
      </At>
      <Tag p={[52, 30]} text="Brand A" color="#5b3fd6" w={58} />
      <Tag p={[308, 30]} text="Brand B" color="#c47a06" w={58} />
      {[150, 180, 210].map((x) => (
        <At key={x} p={[x, 4]}>
          <path data-a="spark" opacity={0} d="M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4 Z" fill="#10a37f" />
        </At>
      ))}
    </>
  ),
  play: (tl, q) => {
    const bars = q('[data-a="bar"]');
    tl.to(bars, { drawSVG: '0%', duration: 0.2 }, 0);
    q('[data-a="spark"]').forEach((s, i) => {
      const t = 0.25 + i * 0.2;
      tl.set(s, { autoAlpha: 1, y: 0, rotation: 0, transformOrigin: '50% 50%' }, t);
      tl.to(s, { y: 36, rotation: 90, duration: 0.6, ease: 'power1.in' }, t);
      tl.to(s, { autoAlpha: 0, duration: 0.15 }, t + 0.55);
    });
    tl.to(bars, { drawSVG: '100%', duration: 0.45, stagger: 0.1, ease: 'power2.out' }, 1.1);
    tl.to(q('[data-a="vs"]'), { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, 1.9);
    end(tl, 2.9);
  },
};

// ---------- 6. bookmarks: links from the phone go into collections ----------
const BM_FROM = m(1.4, 2.48, 1.6);
const BM_TO: P2[] = [m(4.75, 1.85, 0.7), m(3.35, 4.55, 0.7), m(4.75, 4.55, 0.7)];
const BM_ROWS: [number, string][] = [
  [2.0, '#e3dcff'],
  [1.65, '#c9f3e6'],
  [1.3, '#ffe2c9'],
  [0.95, '#e3dcff'],
];

const bookmarks: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[0.8, 2.3, 0, 2.0, 2.48, 2.6]} c={DARK} />
      <Face plane="y" at={2.48} a0={0.9} a1={1.9} z0={0.15} z1={2.45} fill="#f6f4ff" />
      {BM_ROWS.map(([z, c]) => (
        <Face key={z} plane="y" at={2.48} a0={1.0} a1={1.8} z0={z} z1={z + 0.2} fill={c} />
      ))}
      <Folder data-a="folder" x={4.2} y={1.3} c={MINT} />
      <Folder data-a="folder" x={2.8} y={4.0} c={VIOLET} />
      <Folder data-a="folder" x={4.2} y={4.0} c={AMBER} />
      {BM_TO.map((_, i) => (
        <At key={i} p={BM_FROM}>
          <g data-a="link" opacity={0}>
            <rect x={-10} y={-5} width={20} height={10} rx={5} fill="#fff" stroke="#22c3a6" strokeWidth={1.3} />
            <rect x={-6} y={-2} width={6} height={4} rx={2} fill="none" stroke="#22c3a6" strokeWidth={1.2} />
            <rect x={0} y={-2} width={6} height={4} rx={2} fill="none" stroke="#22c3a6" strokeWidth={1.2} />
          </g>
        </At>
      ))}
      <g data-a="preview">
        <rect x={262} y={18} width={86} height={60} rx={9} fill="#fff" stroke="#e3dcff" />
        <rect x={268} y={24} width={74} height={27} rx={5} fill="#ffe7a8" />
        <circle cx={330} cy={31} r={3.5} fill="#ffb02e" />
        <path d="M272 51 L284 39 L292 46 L300 38 L314 51 Z" fill="#22c3a6" />
        <rect x={268} y={57} width={52} height={4} rx={2} fill="#c9c0f0" />
        <rect x={268} y={65} width={34} height={4} rx={2} fill="#e3dcff" />
      </g>
    </>
  ),
  play: (tl, q) => {
    const folders = q('[data-a="folder"]');
    hide(tl, q('[data-a="preview"]'));
    q('[data-a="link"]').forEach((link, i) => {
      const t = 0.3 + i * 0.45;
      fly(tl, link, BM_FROM, BM_TO[i], t, 0.7, 26);
      tl.to(folders[i], { y: -4, duration: 0.12, yoyo: true, repeat: 1 }, t + 0.7);
    });
    pop(tl, q('[data-a="preview"]'), 2.0);
    end(tl, 2.9);
  },
};

// ---------- 7. real-time chat: messages go through the API both ways ----------
const NB_A = m(1.6, 3.38, 1.0);
const NB_S = m(4.2, 4.2, 1.35);
const NB_B = m(3.38, 1.6, 1.0);

const nebulous: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[3.2, 0.4, 0, 3.38, 2.4, 2.1]} c={WHITE} />
      <Face plane="x" at={3.38} a0={0.4} a1={2.4} z0={1.85} z1={2.1} fill="#7c5cff" />
      <Face plane="x" at={3.38} a0={1.1} a1={2.2} z0={1.35} z1={1.6} fill="#e9e3ff" />
      <Face plane="x" at={3.38} a0={0.6} a1={1.6} z0={0.9} z1={1.15} fill="#7c5cff" />
      <Face plane="x" at={3.38} a0={1.3} a1={2.2} z0={0.45} z1={0.7} fill="#e9e3ff" />
      <Bx b={[0.4, 3.2, 0, 2.4, 3.38, 2.1]} c={WHITE} />
      <Face plane="y" at={3.38} a0={0.4} a1={2.4} z0={1.85} z1={2.1} fill="#2f8cff" />
      <Face plane="y" at={3.38} a0={0.6} a1={1.7} z0={1.35} z1={1.6} fill="#dbeaff" />
      <Face plane="y" at={3.38} a0={1.2} a1={2.2} z0={0.9} z1={1.15} fill="#2f8cff" />
      <Face plane="y" at={3.38} a0={0.6} a1={1.5} z0={0.45} z1={0.7} fill="#dbeaff" />
      <Bx b={[3.7, 3.7, 0, 4.7, 4.7, 1.1]} c={NAVY} />
      {[0, 1, 2].map((k) => {
        const [x, y] = m(3.95 + k * 0.28, 4.7, 0.78);
        return <circle key={k} data-a="led" cx={x} cy={y} r={1.6} fill={k === 1 ? '#ff7aa8' : '#7cf2d0'} />;
      })}
      <text x={m(4.2, 4.2, 1.1)[0]} y={m(4.2, 4.2, 1.1)[1] + 2.5} textAnchor="middle" className="pjsc-t pjsc-t--s" fill="#cfd2f0">
        API
      </text>
      <At p={NB_A}>
        <rect data-a="m1" opacity={0} x={-8} y={-4} width={16} height={8} rx={4} fill="#2f8cff" />
      </At>
      <At p={NB_B}>
        <rect data-a="m2" opacity={0} x={-8} y={-4} width={16} height={8} rx={4} fill="#7c5cff" />
      </At>
      <g>
        <circle data-a="live" cx={20} cy={24} r={3.5} fill="#ff4d6d" />
        <text x={28} y={27.5} className="pjsc-t">
          live
        </text>
      </g>
    </>
  ),
  play: (tl, q) => {
    const m1 = q('[data-a="m1"]')[0];
    const m2 = q('[data-a="m2"]')[0];
    const leds = q('[data-a="led"]');
    tl.to(q('[data-a="live"]'), { opacity: 0.25, duration: 0.3, yoyo: true, repeat: 9, ease: 'none' }, 0);
    [0, 1.5].forEach((t0) => {
      route(tl, m1, [NB_A, NB_S, NB_B], t0 + 0.2, 0.8, 0.8);
      tl.to(leds, { fill: '#ffd36b', duration: 0.08, yoyo: true, repeat: 1, stagger: 0.05 }, t0 + 0.55);
      route(tl, m2, [NB_B, NB_S, NB_A], t0 + 0.85, 0.8, 0.8);
      tl.to(leds, { fill: '#ffd36b', duration: 0.08, yoyo: true, repeat: 1, stagger: 0.05 }, t0 + 1.2);
    });
    end(tl, 3.4);
  },
};

// ---------- 8. exchange students: people in different countries, connected ----------
const EX_PINS: [number, number, string, string][] = [
  [1.7, 1.3, '#ffb02e', 'US'],
  [1.6, 4.4, '#22c3a6', 'BR'],
  [4.6, 1.9, '#ff5c8a', 'PT'],
  [4.6, 4.6, '#7c5cff', 'JP'],
];
const EX_HEAD = (i: number) => m(EX_PINS[i][0], EX_PINS[i][1], 1.5);
const EX_ARCS: [number, number][] = [
  [0, 2],
  [2, 3],
  [3, 1],
  [1, 0],
];

const exchangeNetwork: Scene = {
  art: (
    <>
      <Base top={['#dcefff', '#ddd5fc', '#c8bcf7']} />
      <polygon points={mp([[0.5, 0.5, 0.01], [2.8, 0.4, 0.01], [2.9, 2.2, 0.01], [1.0, 2.6, 0.01]])} fill="#c7ecc0" />
      <polygon points={mp([[3.6, 0.9, 0.01], [5.5, 1.2, 0.01], [5.3, 3.0, 0.01], [3.8, 2.7, 0.01]])} fill="#c7ecc0" />
      <polygon points={mp([[0.7, 3.4, 0.01], [2.6, 3.3, 0.01], [2.8, 5.4, 0.01], [1.0, 5.5, 0.01]])} fill="#c7ecc0" />
      <polygon points={mp([[3.6, 3.8, 0.01], [5.4, 3.7, 0.01], [5.5, 5.4, 0.01], [3.9, 5.5, 0.01]])} fill="#c7ecc0" />
      {EX_PINS.map(([x, y, c, code], i) => {
        const [bx, by] = m(x, y, 0);
        const [hx, hy] = EX_HEAD(i);
        return (
          <g key={code}>
            <ellipse cx={bx} cy={by} rx={4.5} ry={2} fill="rgba(40,30,90,0.2)" />
            <path d={`M${bx} ${by} V${hy}`} stroke="#3b3a55" strokeWidth={1.4} />
            <circle cx={hx} cy={hy} r={7.5} fill={c} />
            <text x={hx} y={hy + 2.6} textAnchor="middle" className="pjsc-t pjsc-t--s" fill="#fff">
              {code}
            </text>
          </g>
        );
      })}
      {EX_ARCS.map(([a, b], i) => {
        const [x1, y1] = EX_HEAD(a);
        const [x2, y2] = EX_HEAD(b);
        const [ax, ay] = [x1 + (x2 - x1) * 0.2, y1 + (y2 - y1) * 0.2];
        const [bx, by] = [x2 + (x1 - x2) * 0.2, y2 + (y1 - y2) * 0.2];
        return <path key={i} data-a="arc" d={`M${ax} ${ay} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 20} ${bx} ${by}`} fill="none" stroke="#22c3a6" strokeWidth={1.8} strokeLinecap="round" />;
      })}
      {EX_PINS.map((_, i) => (
        <At key={i} p={up(EX_HEAD(i), 15)}>
          <g data-a="bubble" opacity={0}>
            <rect x={-9} y={-5.5} width={18} height={11} rx={5} fill="#fff" stroke="#c9c0f0" strokeWidth={0.9} />
            <path d="M-2 5.3 L0 8.5 L2 5.3 Z" fill="#fff" />
            {[-4, 0, 4].map((x) => (
              <circle key={x} cx={x} cy={0} r={1.2} fill="#7c5cff" />
            ))}
          </g>
        </At>
      ))}
    </>
  ),
  play: (tl, q) => {
    const arcs = q('[data-a="arc"]');
    tl.to(arcs, { drawSVG: '0%', duration: 0.2 }, 0);
    tl.to(arcs, { drawSVG: '100%', duration: 0.55, stagger: 0.3, ease: 'power1.inOut' }, 0.3);
    q('[data-a="bubble"]').forEach((b, i) => {
      pop(tl, b, 0.75 + i * 0.3);
      tl.to(b, { autoAlpha: 0, duration: 0.3 }, 2.4 + i * 0.1);
    });
    end(tl, 3.1);
  },
};

// ---------- 9. MikoChain: goods move down the line, each step goes on the chain ----------
const MK_DX = m(4.55, 3.05)[0] - m(1.5, 3.05)[0];
const MK_DY = m(4.55, 3.05)[1] - m(1.5, 3.05)[1];
const MK_X = [1.8, 2.7, 3.6, 4.5];

const mikochain: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[0.3, 2.2, 0, 1.4, 3.8, 1.1]} c={AMBER} />
      <Face plane="y" at={3.8} a0={0.5} a1={0.75} z0={0.45} z1={0.75} fill="#fff3d6" />
      <Face plane="y" at={3.8} a0={0.95} a1={1.2} z0={0.45} z1={0.75} fill="#fff3d6" />
      <Face plane="x" at={1.4} a0={2.45} a1={2.7} z0={0.45} z1={0.75} fill="#ffe2a6" />
      <Face plane="x" at={1.4} a0={3.3} a1={3.55} z0={0.45} z1={0.75} fill="#ffe2a6" />
      <Bx b={[0.5, 2.4, 1.1, 0.8, 2.7, 1.75]} c={DARK} />
      {[0, 1].map((k) => (
        <At key={k} p={m(0.65, 2.55, 1.85)}>
          <circle data-a="smoke" opacity={0} r={3.2} fill="#e4e1ee" />
        </At>
      ))}
      <Bx b={[1.4, 2.75, 0, 4.6, 3.35, 0.22]} c={GREY} />
      {[1.8, 2.3, 2.8, 3.3, 3.8, 4.3].map((x) => (
        <Path key={x} pts={[m(x, 2.77, 0.23), m(x, 3.33, 0.23)]} stroke="#a3abbd" strokeWidth={1} />
      ))}
      {[0, 1].map((i) => (
        <g key={i} data-a="box" opacity={i === 0 ? 1 : 0}>
          <Bx b={[1.5, 2.85, 0.22, 1.9, 3.25, 0.58]} c={['#e8c79a', '#c9a06a', '#b38a55']} />
        </g>
      ))}
      <Bx b={[4.5, 2.1, 0, 5.8, 3.9, 1.05]} c={MINT} />
      <Face plane="y" at={3.9} a0={4.85} a1={5.45} z0={0} z1={0.62} fill="#169c85" />
      <Face plane="y" at={3.9} a0={4.5} a1={5.8} z0={0.9} z1={1.05} fill="#9af2db" />
      {MK_X.map((x, i) => (i > 0 ? <Path key={x} data-a="link" pts={[m(MK_X[i - 1] + 0.44, 3.05, 2.22), m(x, 3.05, 2.22)]} stroke="#7c5cff" strokeWidth={1.8} /> : null))}
      {MK_X.map((x) => (
        <g key={x} data-a="block">
          <Bx b={[x, 2.83, 2.0, x + 0.44, 3.27, 2.44]} c={VIOLET} />
        </g>
      ))}
    </>
  ),
  play: (tl, q) => {
    const blocks = q('[data-a="block"]');
    const links = q('[data-a="link"]');
    const boxes = q('[data-a="box"]');
    const smoke = q('[data-a="smoke"]');
    hide(tl, blocks);
    tl.to(links, { drawSVG: '0%', duration: 0.2 }, 0);
    [0.2, 0.8, 1.4, 2.0].forEach((t, k) => {
      const s = smoke[k % 2];
      tl.set(s, { autoAlpha: 0.9, x: 0, y: 0, scale: 0.6, transformOrigin: '50% 50%' }, t);
      tl.to(s, { x: 4, y: -14, scale: 1.5, autoAlpha: 0, duration: 1.1, ease: 'power1.out' }, t);
    });
    boxes.forEach((b, i) => {
      const t = 0.2 + i * 1.0;
      tl.set(b, { autoAlpha: 1, x: 0, y: 0 }, t);
      tl.to(b, { x: MK_DX, y: MK_DY, duration: 2.2, ease: 'none' }, t);
      tl.to(b, { autoAlpha: 0, duration: 0.15 }, t + 2.1);
    });
    blocks.forEach((b, i) => {
      const t = 0.5 + i * 0.55;
      tl.set(b, { y: -8 }, t);
      tl.to(b, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, t);
      if (i > 0) tl.to(links[i - 1], { drawSVG: '100%', duration: 0.25 }, t - 0.1);
    });
    tl.set(boxes[0], { autoAlpha: 1, x: 0, y: 0 }, 3.45);
    end(tl, 3.5);
  },
};

// ---------- 10. landing page: HTML builds it, CSS paints it, JavaScript makes it work ----------
const LP_SECS: [number, number, number, number, string][] = [
  [0.85, 5.15, 1.75, 2.45, '#7c5cff'],
  [0.85, 3.6, 1.4, 1.56, '#2b2d42'],
  [0.85, 2.9, 1.15, 1.27, '#c9c3e3'],
  [3.1, 5.15, 0.3, 1.27, '#ffd36b'],
];
const LP_CUBES: [number, C3, string][] = [
  [1.0, ['#ffb38f', '#e34f26', '#c23f1d'], 'HTML'],
  [2.6, ['#9ccbff', '#1572b6', '#0f5a91'], 'CSS'],
  [4.2, ['#fff3a0', '#f7df1e', '#d6bf10'], 'JS'],
];

const landingPage: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[0.6, 1.6, 0, 5.4, 1.78, 2.9]} c={WHITE} />
      <Face plane="y" at={1.78} a0={0.6} a1={5.4} z0={2.62} z1={2.9} fill="#ece9f8" />
      {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => {
        const [x, y] = m(0.8 + i * 0.22, 1.78, 2.76);
        return <circle key={c} cx={x} cy={y} r={1.6} fill={c} />;
      })}
      {LP_SECS.map(([a0, a1, z0, z1, c]) => (
        <Face key={`${a0}-${z0}`} data-a="sec" data-c={c} plane="y" at={1.78} a0={a0} a1={a1} z0={z0} z1={z1} fill={c} />
      ))}
      <Face data-a="btn" plane="y" at={1.78} a0={0.85} a1={2.0} z0={0.3} z1={0.62} fill="#ff5c8a" />
      {LP_CUBES.map(([x, c, label]) => (
        <g key={label} data-a="cube">
          <Bx b={[x, 3.9, 0, x + 0.7, 4.6, 0.7]} c={c} />
          <Tag p={up(m(x + 0.35, 4.25, 0.7), 10)} text={label} />
        </g>
      ))}
      <At p={m(1.5, 1.78, 0.42)}>
        <path data-a="cursor" opacity={0} d="M0 0 L0 12 L3.2 9 L5.6 13.6 L7.6 12.8 L5.2 8.2 L9.6 8.2 Z" fill="#23233a" stroke="#fff" strokeWidth={1} />
      </At>
    </>
  ),
  play: (tl, q) => {
    const secs = q('[data-a="sec"]');
    const btn = q('[data-a="btn"]');
    const cubes = q('[data-a="cube"]');
    const cursor = q('[data-a="cursor"]');
    hide(tl, [secs, btn]);
    tl.set(secs, { fill: '#dcd7ee' }, 0.2);
    hop(tl, cubes[0], 0.3);
    tl.to(secs, { autoAlpha: 1, duration: 0.3, stagger: 0.12 }, 0.5);
    hop(tl, cubes[1], 1.2);
    secs.forEach((s, i) => tl.to(s, { fill: (s as SVGElement).dataset.c, duration: 0.3 }, 1.4 + i * 0.1));
    hop(tl, cubes[2], 2.0);
    pop(tl, btn, 2.2);
    tl.set(cursor, { autoAlpha: 1, x: 60, y: 26 }, 2.3);
    tl.to(cursor, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' }, 2.3);
    tl.to(cursor, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '0% 0%' }, 2.85);
    tl.to(btn, { fill: '#ff9fbd', duration: 0.1, yoyo: true, repeat: 1 }, 2.85);
    tl.to(cursor, { autoAlpha: 0, duration: 0.3 }, 3.3);
    end(tl, 3.6);
  },
};

// ---------- 11. access control: two roles get in, the guest is stopped ----------
const RB_ROLES: [string, string][] = [
  ['A', '#7c5cff'],
  ['E', '#22c3a6'],
  ['G', '#ff5c8a'],
];
const RB_DOOR = ['#7c5cff', '#22c3a6', '#ffb02e'];
const RB_MOVE: P2 = [m(0, 2.2)[0] - m(0, 4.7)[0], m(0, 2.2)[1] - m(0, 4.7)[1]];

const rbacApp: Scene = {
  art: (
    <>
      <Base />
      {RB_DOOR.map((c, i) => {
        const x0 = 0.5 + i * 1.8;
        return (
          <g key={c}>
            <Bx b={[x0, 1.3, 0, x0 + 1.2, 1.5, 1.9]} c={WHITE} />
            <Face data-a="door" data-c={c} plane="y" at={1.5} a0={x0 + 0.28} a1={x0 + 0.92} z0={0} z1={1.35} fill={c} />
          </g>
        );
      })}
      {RB_DOOR.map((c, i) => (
        <At key={c} p={m(1.1 + i * 1.8, 1.5, 1.66)}>
          <Lock data-a="lock" />
        </At>
      ))}
      {RB_ROLES.map(([letter, c], i) => (
        <At key={letter} p={m(1.1 + i * 1.8, 4.7, 0)}>
          <g data-a="user">
            <ellipse cx={0} cy={0} rx={5.5} ry={2.2} fill="rgba(40,30,90,0.2)" />
            <rect x={-5.5} y={-13} width={11} height={12} rx={5} fill={c} />
            <circle cx={0} cy={-17} r={4.2} fill="#f3d2b9" />
            <text x={0} y={-4} textAnchor="middle" className="pjsc-t pjsc-t--s" fill="#fff">
              {letter}
            </text>
          </g>
        </At>
      ))}
      <text x={14} y={30} className="pjsc-t">
        Admin
      </text>
      <text x={14} y={42} className="pjsc-t">
        Editor
      </text>
      <text x={14} y={54} className="pjsc-t">
        Guest
      </text>
      <circle cx={52} cy={27} r={2.6} fill="#22c3a6" />
      <circle cx={52} cy={39} r={2.6} fill="#22c3a6" />
      <circle cx={52} cy={51} r={2.6} fill="#ff4d6d" />
    </>
  ),
  play: (tl, q) => {
    const users = q('[data-a="user"]');
    const locks = q('[data-a="lock"]');
    const doors = q('[data-a="door"]');
    tl.to(users, { x: RB_MOVE[0], y: RB_MOVE[1], duration: 0.8, stagger: 0.15, ease: 'power2.inOut' }, 0.2);
    tl.to(locks[0], { fill: '#22c3a6', duration: 0.2 }, 1.15);
    tl.to(doors[0], { fill: '#2b2d42', duration: 0.25 }, 1.25);
    tl.to(locks[1], { fill: '#22c3a6', duration: 0.2 }, 1.3);
    tl.to(doors[1], { fill: '#2b2d42', duration: 0.25 }, 1.4);
    tl.to(locks[2], { fill: '#ff4d6d', duration: 0.2 }, 1.45);
    tl.to(users[2], { x: RB_MOVE[0] + 4, duration: 0.06, yoyo: true, repeat: 5 }, 1.5);
    tl.to(users, { x: 0, y: 0, duration: 0.7, ease: 'power2.inOut' }, 2.4);
    tl.to(locks, { fill: '#b8bfcd', duration: 0.3 }, 2.6);
    doors.forEach((d) => tl.to(d, { fill: (d as SVGElement).dataset.c, duration: 0.3 }, 2.6));
    end(tl, 3.3);
  },
};

// ---------- 12. leaf controller: the board drives the lamp, the leaf glows ----------
// board at the front left, the plant in the middle, a lamp on an arm right above it
const LF_STEM = m(3.2, 3.0, 0.55);
const LF_LAMP = m(3.2, 3.0, 3.15);
const LF_WIRE: P2[] = [m(2.3, 4.6, 0.01), m(4.4, 4.6, 0.01), m(4.4, 1.4, 0.01), m(4.4, 1.4, 3.4), m(3.2, 3.0, 3.4)];

const leafIot: Scene = {
  art: (
    <>
      <Base />
      <Path pts={LF_WIRE.slice(0, 3)} stroke="#3b3a55" strokeWidth={1.5} />
      <ellipse cx={LF_WIRE[2][0]} cy={LF_WIRE[2][1]} rx={6} ry={3} fill="#4a4c6b" />
      <Path pts={LF_WIRE.slice(2, 4)} stroke="#4a4c6b" strokeWidth={2.4} />
      <Bx b={[0.5, 3.8, 0, 2.3, 5.4, 0.16]} c={['#f0606c', '#c42a38', '#a1202d']} />
      {[0.7, 0.95, 1.2, 1.45, 1.7, 1.95].map((x) => (
        <g key={x}>
          <Flat x0={x} y0={3.92} x1={x + 0.12} y1={4.04} z={0.17} fill="#2b2b33" />
          <Flat x0={x} y0={5.16} x1={x + 0.12} y1={5.28} z={0.17} fill="#2b2b33" />
        </g>
      ))}
      <Bx b={[1.0, 4.25, 0.16, 1.7, 4.95, 0.3]} c={['#3a3a44', '#1d1d24', '#141418']} />
      <circle data-a="led" cx={m(2.05, 4.45, 0.17)[0]} cy={m(2.05, 4.45, 0.17)[1]} r={2} fill="#22e696" />
      <ellipse data-a="glow" opacity={0} cx={LF_STEM[0]} cy={LF_STEM[1] - 13} rx={19} ry={15} fill="rgba(255,77,109,0.35)" />
      <Bx b={[2.8, 2.6, 0, 3.6, 3.4, 0.55]} c={['#f2a072', '#e07a3f', '#c4652f']} />
      <Flat x0={2.85} y0={2.65} x1={3.55} y1={3.35} z={0.56} fill="#6b4a32" />
      <path d={`M${pt(LF_STEM)} v-12`} stroke="#3d9e59" strokeWidth={1.4} />
      <path d={`M${pt(LF_STEM)} c-12 -6 -15 -18 -6 -24 c1 8 2 16 6 24 Z`} fill="#4fb46b" />
      <path d={`M${pt(LF_STEM)} c11 -5 15 -16 8 -22 c-2 7 -4 14 -8 22 Z`} fill="#3d9e59" />
      <Path pts={LF_WIRE.slice(3)} stroke="#4a4c6b" strokeWidth={2} />
      <Bx b={[2.95, 2.75, 3.15, 3.45, 3.25, 3.4]} c={DARK} />
      <polygon
        data-a="beam"
        points={`${LF_LAMP[0] - 4},${LF_LAMP[1] + 1} ${LF_LAMP[0] + 4},${LF_LAMP[1] + 1} ${LF_LAMP[0] + 15},${LF_STEM[1] - 16} ${LF_LAMP[0] - 15},${LF_STEM[1] - 16}`}
        fill="rgba(120,170,255,0.32)"
      />
      {[0, 1, 2].map((i) => (
        <At key={i} p={LF_WIRE[0]}>
          <circle data-a="pulse" opacity={0} r={2.3} fill="#7cf2d0" />
        </At>
      ))}
      <g>
        <rect x={278} y={14} width={50} height={92} rx={10} fill="#2b2d42" />
        <rect x={282} y={22} width={42} height={76} rx={6} fill="#f6f4ff" />
        <rect x={287} y={28} width={24} height={4} rx={2} fill="#c9c0f0" />
        {[14, 24, 18, 30].map((h, i) => (
          <rect key={i} data-a="cbar" x={288 + i * 8.5} y={90 - h} width={6} height={h} rx={1.5} fill={i % 2 ? '#22c3a6' : '#7c5cff'} />
        ))}
      </g>
    </>
  ),
  play: (tl, q) => {
    const cbars = q('[data-a="cbar"]');
    const beam = q('[data-a="beam"]');
    const glow = q('[data-a="glow"]');
    tl.to(cbars, { scaleY: 0.1, duration: 0.2, transformOrigin: '50% 100%' }, 0);
    tl.to(beam, { opacity: 0, duration: 0.2 }, 0);
    ['#ff4d6d', '#22e696', '#4aa8ff', '#22e696'].forEach((c, i) => tl.to(q('[data-a="led"]'), { fill: c, duration: 0.05 }, 0.2 + i * 0.25));
    q('[data-a="pulse"]').forEach((p, i) => route(tl, p, LF_WIRE, 0.3 + i * 0.3, 1.0));
    tl.to(beam, { opacity: 1, duration: 0.25 }, 1.4);
    tl.to(glow, { autoAlpha: 1, duration: 0.35 }, 1.6);
    tl.to(cbars, { scaleY: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(2)', transformOrigin: '50% 100%' }, 1.9);
    tl.to(glow, { autoAlpha: 0, duration: 0.4 }, 2.8);
    end(tl, 3.3);
  },
};

// ---------- 13. GetPOC: theses on screen, filtered, access by role ----------
const GP_LOCK = m(5.15, 2.08, 2.75);

const getpoc: Scene = {
  art: (
    <>
      <Base />
      <Bx b={[2.3, 1.2, 0, 3.7, 2.3, 0.08]} c={GREY} />
      <Bx b={[2.85, 1.55, 0.08, 3.15, 1.8, 0.6]} c={GREY} />
      <Bx b={[0.7, 1.9, 0.5, 5.3, 2.08, 2.9]} c={DARK} />
      <Face plane="y" at={2.08} a0={0.85} a1={5.15} z0={0.65} z1={2.75} fill="#fbfaff" />
      <Face plane="y" at={2.08} a0={0.85} a1={5.15} z0={2.45} z1={2.75} fill="#7c5cff" />
      {[2.05, 1.65, 1.25, 0.85].map((z, i) => (
        <g key={z} data-a="row">
          <Face plane="y" at={2.08} a0={1.05} a1={1.35} z0={z} z1={z + 0.25} fill="#ff4d6d" />
          <Face plane="y" at={2.08} a0={1.5} a1={i % 2 ? 3.8 : 4.6} z0={z + 0.07} z1={z + 0.18} fill="#c9c3e3" />
        </g>
      ))}
      <Bx b={[1.5, 2.9, 0, 3.7, 3.5, 0.08]} c={GREY} />
      <Bx b={[4.0, 3.6, 0, 5.2, 4.5, 0.18]} c={PINK} />
      <Bx b={[4.05, 3.65, 0.18, 5.15, 4.45, 0.36]} c={BLUE} />
      <Bx b={[4.1, 3.7, 0.36, 5.1, 4.4, 0.54]} c={MINT} />
      <path data-a="funnel" d="M286 18 H330 L314 38 V50 L302 56 V38 Z" fill="#7c5cff" />
      <At p={[GP_LOCK[0] + 4, GP_LOCK[1] - 4]}>
        <g data-a="lock">
          <Lock fill="#22c3a6" />
        </g>
      </At>
    </>
  ),
  play: (tl, q) => {
    const rows = q('[data-a="row"]');
    const funnel = q('[data-a="funnel"]');
    hide(tl, [funnel, q('[data-a="lock"]')]);
    tl.set(funnel, { autoAlpha: 1, y: -24 }, 0.3);
    tl.to(funnel, { y: 0, duration: 0.55, ease: 'bounce.out' }, 0.3);
    tl.to([rows[1], rows[3]], { opacity: 0.18, duration: 0.3 }, 1.0);
    tl.to(rows[0], { x: 3, duration: 0.18, yoyo: true, repeat: 1 }, 1.35);
    pop(tl, q('[data-a="lock"]'), 1.8);
    tl.to([rows[1], rows[3]], { opacity: 1, duration: 0.3 }, 2.8);
    end(tl, 3.2);
  },
};

// ---------- 14. search engine: words go into a PATRICIA tree, a search walks it ----------
const SE_NODES: [number, number][] = [
  [1.0, 1.0],
  [1.1, 3.1],
  [3.1, 1.1],
  [0.9, 5.1],
  [2.9, 4.4],
  [5.1, 0.9],
  [4.4, 2.9],
];
const SE_HIT = [0, 1, 4];
const SE_EDGES: [number, number, string, 'start' | 'end'][] = [
  [0, 1, 'se', 'end'],
  [0, 2, 'fi', 'start'],
  [1, 3, 'a', 'end'],
  [1, 4, 'arch', 'end'],
  [2, 5, 'le', 'start'],
  [2, 6, 'nd', 'start'],
];
const SE_TOP = (i: number) => m(SE_NODES[i][0], SE_NODES[i][1], 0.32);
const SE_SRC: P2 = [40, 58];

const searchEngine: Scene = {
  art: (
    <>
      <Base />
      {SE_EDGES.map(([a, b]) => (
        <Path key={`${a}-${b}`} data-a="edge" pts={[m(SE_NODES[a][0], SE_NODES[a][1], 0.02), m(SE_NODES[b][0], SE_NODES[b][1], 0.02)]} stroke="#a996ff" strokeWidth={1.8} />
      ))}
      {SE_EDGES.map(([a, b, label, anchor]) => {
        const p = m((SE_NODES[a][0] + SE_NODES[b][0]) / 2, (SE_NODES[a][1] + SE_NODES[b][1]) / 2, 0);
        return (
          <text key={label} x={p[0] + (anchor === 'end' ? -6 : 6)} y={p[1] + 2} textAnchor={anchor} className="pjsc-t pjsc-t--s" fill="#5b3fd6">
            {label}
          </text>
        );
      })}
      {SE_NODES.map(([x, y], i) => (
        <g key={i} data-a="node" data-o={pt(m(x, y, 0))}>
          <polygon points={mp([[x - 0.28, y + 0.28, 0], [x + 0.28, y + 0.28, 0], [x + 0.28, y + 0.28, 0.32], [x - 0.28, y + 0.28, 0.32]])} fill="#e9e3ff" />
          <polygon points={mp([[x + 0.28, y - 0.28, 0], [x + 0.28, y + 0.28, 0], [x + 0.28, y + 0.28, 0.32], [x + 0.28, y - 0.28, 0.32]])} fill="#d6ccfb" />
          <polygon
            data-a={SE_HIT.includes(i) ? 'hit' : undefined}
            points={mp([[x - 0.28, y - 0.28, 0.32], [x + 0.28, y - 0.28, 0.32], [x + 0.28, y + 0.28, 0.32], [x - 0.28, y + 0.28, 0.32]])}
            fill={SE_HIT.includes(i) ? '#7c5cff' : '#ffffff'}
          />
        </g>
      ))}
      <At p={[30, 52]}>
        <Sheet />
      </At>
      <At p={SE_SRC}>
        <Sheet />
      </At>
      {['sea', 'file', 'find'].map((w) => (
        <At key={w} p={SE_SRC}>
          <g data-a="word" opacity={0}>
            <Tag p={[0, 0]} text={w} />
          </g>
        </At>
      ))}
      <At p={up(SE_TOP(0), 11)}>
        <g data-a="query" opacity={0}>
          <Tag p={[0, 0]} text="search" fill="#23233a" color="#fff" />
        </g>
      </At>
      <At p={up(SE_TOP(4), 13)}>
        <g data-a="found">
          <Check r={5.5} />
        </g>
      </At>
    </>
  ),
  play: (tl, q) => {
    const nodes = q('[data-a="node"]');
    const edges = q('[data-a="edge"]');
    const hits = q('[data-a="hit"]');
    hide(tl, q('[data-a="found"]'));
    tl.to(hits, { fill: '#ffffff', duration: 0.2 }, 0);
    tl.set(edges, { drawSVG: '0%' }, 0.15);
    nodes.forEach((n) => tl.set(n, { scale: 0, svgOrigin: origin(n) }, 0.15));
    q('[data-a="word"]').forEach((w, i) => fly(tl, w, SE_SRC, up(SE_TOP(0), 4), 0.2 + i * 0.2, 0.5, 18));
    const grow = (i: number, t: number) => tl.to(nodes[i], { scale: 1, duration: 0.3, ease: 'back.out(2.4)', svgOrigin: origin(nodes[i]) }, t);
    grow(0, 0.25);
    [1, 2].forEach((i, k) => grow(i, 0.65 + k * 0.08));
    [3, 4, 5, 6].forEach((i, k) => grow(i, 1.0 + k * 0.08));
    tl.to([edges[0], edges[1]], { drawSVG: '100%', duration: 0.3 }, 0.45);
    tl.to(edges.slice(2), { drawSVG: '100%', duration: 0.3, stagger: 0.06 }, 0.8);
    route(tl, q('[data-a="query"]')[0], [up(SE_TOP(0), 11), up(SE_TOP(1), 11), up(SE_TOP(4), 11)], 1.5, 0.9);
    hits.forEach((h, i) => tl.to(h, { fill: '#7c5cff', duration: 0.15 }, 1.5 + i * 0.44));
    pop(tl, q('[data-a="found"]'), 2.5);
    end(tl, 3.2);
  },
};

// ---------- 15. file system: commands make folders and move files ----------
const FS_FROM = m(1.45, 1.45, 0.95);
const FS_TO = m(4.15, 1.55, 0.95);

const fileSystem: Scene = {
  art: (
    <>
      <Base />
      <rect x={8} y={24} width={98} height={50} rx={8} fill="#1c1b29" />
      {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
        <circle key={c} cx={16 + i * 7} cy={32} r={2.2} fill={c} />
      ))}
      <text data-a="cmd" x={14} y={49} className="pjsc-term">
        $ mkdir docs
      </text>
      <text data-a="cmd" x={14} y={63} className="pjsc-term">
        $ mv cv.pdf docs/
      </text>
      <Path data-a="branch" pts={[m(1.45, 1.45, 0.02), m(4.15, 1.55, 0.02)]} stroke="#a996ff" strokeWidth={1.8} />
      <Path pts={[m(1.45, 1.45, 0.02), m(1.55, 4.15, 0.02)]} stroke="#a996ff" strokeWidth={1.8} />
      <Folder x={0.9} y={0.9} c={VIOLET} />
      <Tag p={up(m(1.45, 1.45, 0.64), 9)} text="~" w={16} />
      <g data-a="dir" data-o={pt(m(4.15, 2.1, 0))}>
        <Folder x={3.6} y={1.0} c={AMBER} />
        <Tag p={up(m(4.15, 1.55, 0.64), 9)} text="docs" />
      </g>
      <Folder x={1.0} y={3.6} c={MINT} />
      <Tag p={up(m(1.55, 4.15, 0.64), 9)} text="img" />
      <At p={FS_FROM}>
        <g data-a="file" opacity={0}>
          <Sheet />
        </g>
      </At>
    </>
  ),
  play: (tl, q) => {
    const [cmd1, cmd2] = q('[data-a="cmd"]');
    const dir = q('[data-a="dir"]')[0];
    const branch = q('[data-a="branch"]');
    tl.set([cmd1, cmd2], { text: '' }, 0.05);
    tl.to(branch, { drawSVG: '0%', duration: 0.2 }, 0);
    tl.to(dir, { scale: 0.05, autoAlpha: 0, duration: 0.2, svgOrigin: origin(dir) }, 0);
    tl.to(cmd1, { text: { value: '$ mkdir docs' }, duration: 0.6, ease: 'none' }, 0.25);
    tl.to(branch, { drawSVG: '100%', duration: 0.3 }, 0.9);
    tl.to(dir, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)', svgOrigin: origin(dir) }, 1.05);
    tl.to(cmd2, { text: { value: '$ mv cv.pdf docs/' }, duration: 0.7, ease: 'none' }, 1.4);
    fly(tl, q('[data-a="file"]')[0], FS_FROM, FS_TO, 2.15, 0.6, 22);
    tl.to(dir, { y: -3, duration: 0.12, yoyo: true, repeat: 1 }, 2.75);
    end(tl, 3.3);
  },
};

// ---------- registry ----------
const SCENES: Record<string, Scene> = {
  'city-hall': cityHall,
  'rag-chatbot': ragChatbot,
  'rag-benchmark': ragBenchmark,
  'energy-anomaly': energyAnomaly,
  'battle-cards': battleCards,
  bookmarks,
  nebulous,
  'exchange-network': exchangeNetwork,
  mikochain,
  'landing-page': landingPage,
  'rbac-app': rbacApp,
  'leaf-iot': leafIot,
  getpoc,
  'search-engine': searchEngine,
  'file-system': fileSystem,
};

/** The animated picture at the top of a project card. */
export function ProjectScene({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scene = SCENES[id];

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !scene) return;
      const q = gsap.utils.selector(el) as Q;
      const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.9 });
      scene.play(tl, q);
      // every story ends on the finished drawing, so the resting picture is its last frame
      tl.progress(1, true);
      const card = el.closest<HTMLElement>('.pj');
      if (!card || prefersReducedMotion()) return;

      let settle: gsap.core.Tween | null = null;
      let wait: gsap.core.Tween | null = null;
      // `loop`: hover and tap keep the story going; scrolling into view (phones) plays it once
      const start = (loop = true) => {
        settle?.kill();
        wait?.kill();
        el.setAttribute('data-playing', '');
        tl.repeat(loop ? -1 : 0).restart();
      };
      // when the cursor leaves, the story quickly finishes and stays on its last frame
      const stop = () => {
        wait?.kill();
        el.removeAttribute('data-playing');
        tl.pause();
        settle = gsap.to(tl, { progress: 1, duration: 0.4, ease: 'power1.out' });
      };
      tl.eventCallback('onComplete', () => el.removeAttribute('data-playing'));
      const hover = window.matchMedia('(hover: hover)').matches;
      const enter = () => start();
      const tap = () => (el.hasAttribute('data-playing') ? stop() : start());
      if (hover) {
        card.addEventListener('pointerenter', enter);
        card.addEventListener('pointerleave', stop);
      } else {
        el.addEventListener('click', tap);
      }
      // On phones the story also plays once as the card scrolls into view, and
      // again each time it comes back. On every screen it stops off screen.
      const playOnScroll = !SHOTS && isPhone();
      let seen = false;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            seen = false;
            if (el.hasAttribute('data-playing')) stop();
            else wait?.kill();
            return;
          }
          if (!playOnScroll || seen || entry.intersectionRatio < 0.6) return;
          seen = true;
          if (el.hasAttribute('data-playing')) return;
          // cards side by side (a phone held sideways) start one after the other
          const row = card.parentElement?.getBoundingClientRect().left ?? 0;
          const box = card.getBoundingClientRect();
          const column = Math.max(0, Math.round((box.left - row) / Math.max(1, box.width)));
          wait = gsap.delayedCall(0.15 + column * 0.3, () => start(false));
        },
        // the bottom strip is left out: the phone navigation sits there
        { threshold: [0, 0.6], rootMargin: '0px 0px -12% 0px' },
      );
      io.observe(el);
      return () => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointerleave', stop);
        el.removeEventListener('click', tap);
        io.disconnect();
        settle?.kill();
        wait?.kill();
      };
    },
    { scope: ref },
  );

  if (!scene) return null;
  return (
    <div className="pj__scene" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 360 136">{scene.art}</svg>
    </div>
  );
}
