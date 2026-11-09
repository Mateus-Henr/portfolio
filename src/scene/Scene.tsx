import type { CSSProperties, ReactNode } from 'react';
import { StoryStage } from '../story/StoryStage';
import type { StoryKit } from '../story/useStory';
import { Layer } from '../components/stage/Layer';
import { pop, shot } from '../story/kit';
import { TechGlyph } from '../site/tech';

/*
  Story: "The Architecture Machine".
  A blueprint draws itself, and a small city is built from it, block by
  block, with City Hall in the middle (Matt's current project is a platform a
  city hall uses to handle citizens' requests). Then the city separates into
  the layers it is really made of, each labelled with the tools Matt uses:
  interface, services and access control, data, infrastructure. A citizen's
  request travels down through the layers and back up to City Hall, and the
  layers click back together into the finished city.
*/

// ---------- isometric drawing helpers ----------
const W = 1600;
const H = 1100;
const U = 54; // one grid block, px
const CX = U * 0.866;
const SY = U * 0.5;
const ZU = U * 0.92; // one unit of height, px
const OX = 800;
const OY = 300;

type P3 = [number, number, number];
type BBox = [number, number, number, number];

const iso = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * CX, OY + (x + y) * SY - z * ZU];
const poly = (ps: P3[]) => ps.map((p) => iso(...p).map((n) => n.toFixed(1)).join(',')).join(' ');

function bbox(ps: P3[], pad = 6): BBox {
  const xs: number[] = [];
  const ys: number[] = [];
  ps.forEach((p) => {
    const [x, y] = iso(...p);
    xs.push(x);
    ys.push(y);
  });
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
}

const corners = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): P3[] => [
  [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
  [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
];

function faces(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  return {
    top: poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]),
    left: poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
    right: poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]),
  };
}

function Block({ b, c, edge }: { b: [number, number, number, number, number, number]; c: [string, string, string]; edge?: string }) {
  const f = faces(...b);
  const stroke = edge ? { stroke: edge, strokeWidth: 1.2, strokeLinejoin: 'round' as const } : {};
  return (
    <g>
      <polygon points={f.left} fill={c[1]} {...stroke} />
      <polygon points={f.right} fill={c[2]} {...stroke} />
      <polygon points={f.top} fill={c[0]} {...stroke} />
    </g>
  );
}

/** Rows of windows on the two visible walls of a box. */
function Windows({ b, color, alt, step = 0.5, col = 0.36 }: { b: [number, number, number, number, number, number]; color: string; alt: string; step?: number; col?: number }) {
  const [x0, y0, z0, x1, y1, z1] = b;
  const out: ReactNode[] = [];
  for (let z = z0 + 0.25; z + 0.22 <= z1 - 0.12; z += step) {
    for (let x = x0 + 0.14; x + col * 0.6 <= x1 - 0.1; x += col) {
      out.push(<polygon key={`l${x}-${z}`} points={poly([[x, y1, z], [x + col * 0.55, y1, z], [x + col * 0.55, y1, z + 0.22], [x, y1, z + 0.22]])} fill={color} />);
    }
    for (let y = y0 + 0.14; y + col * 0.6 <= y1 - 0.1; y += col) {
      out.push(<polygon key={`r${y}-${z}`} points={poly([[x1, y, z], [x1, y + col * 0.55, z], [x1, y + col * 0.55, z + 0.22], [x1, y, z + 0.22]])} fill={alt} />);
    }
  }
  return <g>{out}</g>;
}

// ---------- the things in the city ----------
interface Thing {
  name: string;
  depth: number;
  box: BBox;
  base: [number, number];
  wire: string[];
  node: ReactNode;
  tree?: boolean;
}

type Six = [number, number, number, number, number, number];

function tower(name: string, b: Six, c: [string, string, string], win: [string, string], extra?: ReactNode): Thing {
  const f = faces(...b);
  return {
    name,
    depth: (b[0] + b[3]) / 2 + (b[1] + b[4]) / 2,
    box: bbox(corners(...b)),
    base: iso((b[0] + b[3]) / 2, b[4], 0),
    wire: [f.left, f.right, f.top],
    node: (
      <>
        <Block b={b} c={c} />
        <Windows b={b} color={win[0]} alt={win[1]} />
        {extra}
      </>
    ),
  };
}

function house(name: string, x0: number, y0: number, x1: number, y1: number, h: number, wall: [string, string], roof: [string, string]): Thing {
  const ym = (y0 + y1) / 2;
  const rh = 0.55;
  const back = poly([[x0, y0, h], [x1, y0, h], [x1, ym, h + rh], [x0, ym, h + rh]]);
  const front = poly([[x0, y1, h], [x1, y1, h], [x1, ym, h + rh], [x0, ym, h + rh]]);
  const gable = poly([[x1, y0, h], [x1, y1, h], [x1, ym, h + rh]]);
  const f = faces(x0, y0, 0, x1, y1, h);
  const door = poly([[x0 + 0.4, y1, 0], [x0 + 0.62, y1, 0], [x0 + 0.62, y1, 0.42], [x0 + 0.4, y1, 0.42]]);
  return {
    name,
    depth: (x0 + x1) / 2 + (y0 + y1) / 2,
    box: bbox([...corners(x0, y0, 0, x1, y1, h), [x0, ym, h + rh], [x1, ym, h + rh]]),
    base: iso((x0 + x1) / 2, y1, 0),
    wire: [f.left, f.right, front],
    node: (
      <>
        <polygon points={back} fill={roof[1]} />
        <polygon points={f.left} fill={wall[0]} />
        <polygon points={f.right} fill={wall[1]} />
        <polygon points={door} fill="#6d4aff" />
        <polygon points={poly([[x1, y0 + 0.25, 0.3], [x1, y0 + 0.5, 0.3], [x1, y0 + 0.5, 0.55], [x1, y0 + 0.25, 0.55]])} fill="#ffe7a8" />
        <polygon points={gable} fill={wall[1]} />
        <polygon points={front} fill={roof[0]} />
      </>
    ),
  };
}

function cityHall(): Thing {
  const lower: Six = [2.85, 2.85, 0, 4.15, 4.15, 0.9];
  const upper: Six = [3.15, 3.15, 0.9, 3.85, 3.85, 1.4];
  const fl = faces(...lower);
  const [dx, dy] = iso(3.5, 3.5, 1.4);
  const r = 30;
  const columns: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 2.98 + i * 0.26;
    columns.push(<polygon key={`cl${i}`} points={poly([[x, 4.15, 0.08], [x + 0.08, 4.15, 0.08], [x + 0.08, 4.15, 0.72], [x, 4.15, 0.72]])} fill="#d9d1f5" />);
    const y = 2.98 + i * 0.26;
    columns.push(<polygon key={`cr${i}`} points={poly([[4.15, y, 0.08], [4.15, y + 0.08, 0.08], [4.15, y + 0.08, 0.72], [4.15, y, 0.72]])} fill="#c8bdf0" />);
  }
  const [fx, fy] = iso(3.5, 3.5, 2.05);
  return {
    name: 'b-hall',
    depth: 7,
    box: [dx - 140, fy - 80, dx + 140, iso(4.15, 4.15, 0)[1] + 8],
    base: iso(3.5, 4.15, 0),
    wire: [fl.left, fl.right, fl.top],
    node: (
      <>
        <Block b={lower} c={['#ffffff', '#f4f1fd', '#e4def6']} />
        {columns}
        <Block b={upper} c={['#ffffff', '#f1edfd', '#ddd5f6']} />
        <path d={`M${dx - r} ${dy} A${r} ${r * 1.05} 0 0 1 ${dx + r} ${dy} A${r} ${r * 0.5} 0 0 1 ${dx - r} ${dy} Z`} fill="#6d4aff" />
        <path d={`M${dx - r * 0.55} ${dy - r * 0.6} A${r * 0.7} ${r * 0.7} 0 0 1 ${dx} ${dy - r * 1.02}`} fill="none" stroke="#a996ff" strokeWidth={4} strokeLinecap="round" />
        <path d={`M${fx} ${fy} V${fy - 62}`} stroke="#3b3a55" strokeWidth={3} />
        <path className="v21-flag" d={`M${fx} ${fy - 62} l30 9 l-30 9 Z`} fill="#ff5c8a" />
        <text x={dx} y={iso(3.5, 4.15, 0.95)[1] + 4} textAnchor="middle" className="v21-hall">CITY HALL</text>
      </>
    ),
  };
}

function tree(name: string, x: number, y: number, r = 0.34, color = '#3cbf86'): Thing {
  const [tx, ty] = iso(x, y, 0);
  const R = r * U;
  return {
    name,
    depth: x + y,
    box: [tx - R - 4, ty - R * 2.6 - 4, tx + R + 4, ty + 6],
    base: [tx, ty],
    wire: [],
    tree: true,
    node: (
      <>
        <ellipse cx={tx} cy={ty} rx={R * 0.7} ry={R * 0.32} fill="rgba(20,60,40,0.18)" />
        <rect x={tx - 3} y={ty - R * 1.1} width={6} height={R * 1.1} rx={2} fill="#8a5a3c" />
        <circle cx={tx} cy={ty - R * 1.55} r={R} fill={color} />
        <circle cx={tx - R * 0.35} cy={ty - R * 1.85} r={R * 0.4} fill="#fff" opacity={0.18} />
      </>
    ),
  };
}

function fountain(name: string, x: number, y: number): Thing {
  const [fx, fy] = iso(x, y, 0);
  return {
    name,
    depth: x + y,
    box: [fx - 46, fy - 50, fx + 46, fy + 22],
    base: [fx, fy],
    wire: [],
    tree: true,
    node: (
      <>
        <ellipse cx={fx} cy={fy} rx={40} ry={20} fill="#cfd5e3" />
        <ellipse cx={fx} cy={fy - 4} rx={34} ry={16} fill="#7cc8ff" />
        <path className="v21-water" d={`M${fx} ${fy - 6} C${fx - 6} ${fy - 30} ${fx + 6} ${fy - 40} ${fx} ${fy - 44}`} stroke="#bfe6ff" strokeWidth={5} fill="none" strokeLinecap="round" />
      </>
    ),
  };
}

const THINGS: Thing[] = [
  tower('b-tower', [0.35, 0.35, 0, 1.65, 1.65, 3.6], ['#b4a3ff', '#7c5cff', '#5b3fd6'], ['#e9e4ff', '#c9bbff']),
  tree('t-1', 1.85, 0.3, 0.26),
  tower('b-office', [2.85, 0.4, 0, 4.15, 1.6, 2.4], ['#9af2db', '#22c3a6', '#169c85'], ['#e6fffa', '#bdf5e8']),
  tower('b-flats', [5.3, 0.35, 0, 6.7, 1.65, 2.0], ['#ffdc93', '#ffb02e', '#e8920c'], ['#fff3d6', '#ffe2a6']),
  house('b-house-1', 0.35, 2.95, 1.65, 4.05, 0.85, ['#fbefe2', '#eadbc9'], ['#ff5c8a', '#d9466f']),
  cityHall(),
  tower(
    'b-shop',
    [5.3, 2.95, 0, 6.4, 4.05, 1.1],
    ['#ffd8c9', '#ff9f80', '#ef7f5c'],
    ['#fff1ea', '#ffd6c6'],
  ),
  tree('t-2', 6.75, 3.1, 0.24),
  house('b-house-2', 0.35, 5.35, 1.3, 6.5, 0.8, ['#fbefe2', '#eadbc9'], ['#ffb02e', '#e8920c']),
  tree('t-3', 1.7, 5.6, 0.28, '#4cc38a'),
  tree('t-4', 1.65, 6.6, 0.24, '#2fae74'),
  fountain('f-1', 3.5, 6.0),
  tree('t-5', 2.95, 5.35, 0.24, '#4cc38a'),
  tree('t-6', 4.1, 6.65, 0.26, '#2fae74'),
  tree('t-7', 2.95, 6.65, 0.22, '#3cbf86'),
  tower('b-library', [5.3, 5.3, 0, 6.7, 6.5, 1.3], ['#c3e6ff', '#4aa8ff', '#2f86e0'], ['#e6f4ff', '#cfe7ff']),
  tree('t-8', 5.65, 6.78, 0.22, '#4cc38a'),
].sort((a, b) => a.depth - b.depth);

// ---------- layer slabs ----------
const ROADS: Six[] = [
  [0, 2.0, 0, 7, 2.6, 0.01],
  [0, 4.4, 0, 7, 5.0, 0.01],
  [2.0, 0, 0, 2.6, 7, 0.01],
  [4.4, 0, 0, 5.0, 7, 0.01],
];
const SPLIT = { city: -170, ground: 0, data: 140, infra: 270 };

const GROUND_BOX = bbox(corners(0, 0, -0.7, 7, 7, 0.6));
const DATA_BOX = bbox(corners(0.25, 0.25, -1.7, 6.75, 6.75, 0.4));
const INFRA_BOX = bbox(corners(0.5, 0.5, -2.5, 6.5, 6.5, -0.9));
const PLAN_BOX = bbox(corners(-0.4, -0.4, 0, 7.4, 7.4, 3.8));

function Sprite({ name, b, origin, className, style, children }: { name: string; b: BBox; origin?: [number, number]; className?: string; style?: CSSProperties; children: ReactNode }) {
  const [x0, y0, x1, y1] = b;
  return (
    <Layer name={name} x={x0} y={y0} w={x1 - x0} h={y1 - y0} origin={origin ? `${origin[0] - x0}px ${origin[1] - y0}px` : undefined} className={className} style={style}>
      <svg className="art" viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} aria-hidden="true">
        {children}
      </svg>
    </Layer>
  );
}

function Ground() {
  const dash = (a: P3, b: P3) => {
    const [x1, y1] = iso(...a);
    const [x2, y2] = iso(...b);
    return <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#fff" strokeWidth={3} strokeDasharray="10 12" strokeLinecap="round" />;
  };
  const cars: [number, number, string][] = [
    [0.8, 2.3, '#ff5c8a'],
    [5.9, 4.7, '#6d4aff'],
    [4.7, 1.0, '#ffb02e'],
  ];
  const [gx, gy] = iso(2.3, 4.7, 0);
  return (
    <Sprite name="ground" b={GROUND_BOX}>
      <Block b={[0, 0, -0.7, 7, 7, 0]} c={['#b8ecb0', '#c99a6c', '#b2855a']} />
      <polygon points={poly([[0, 7, -0.16], [7, 7, -0.16], [7, 7, 0], [0, 7, 0]])} fill="#86cf79" />
      <polygon points={poly([[7, 0, -0.16], [7, 7, -0.16], [7, 7, 0], [7, 0, 0]])} fill="#6fbd63" />
      {ROADS.map((r, i) => (
        <polygon key={i} points={faces(...r).top} fill="#e4e7ef" />
      ))}
      <polygon points={poly([[2.6, 2.6, 0.012], [4.4, 2.6, 0.012], [4.4, 4.4, 0.012], [2.6, 4.4, 0.012]])} fill="#f6f1e8" />
      {dash([0.1, 2.3, 0.02], [6.9, 2.3, 0.02])}
      {dash([0.1, 4.7, 0.02], [6.9, 4.7, 0.02])}
      {dash([2.3, 0.1, 0.02], [2.3, 6.9, 0.02])}
      {dash([4.7, 0.1, 0.02], [4.7, 6.9, 0.02])}
      {cars.map(([x, y, c], i) => (
        <Block key={i} b={[x - 0.22, y - 0.13, 0.02, x + 0.22, y + 0.13, 0.2]} c={[c, c, c]} />
      ))}
      {/* access-control gate on the way into the centre */}
      <g data-layer="gate">
        <Block b={[2.05, 4.55, 0, 2.12, 4.62, 0.62]} c={['#3b3a55', '#3b3a55', '#2b2a40']} />
        <Block b={[2.48, 4.55, 0, 2.55, 4.62, 0.62]} c={['#3b3a55', '#3b3a55', '#2b2a40']} />
        <Block b={[2.05, 4.55, 0.55, 2.55, 4.62, 0.66]} c={['#3b3a55', '#3b3a55', '#2b2a40']} />
      </g>
      <circle data-layer="gate-light" cx={gx} cy={gy - 42} r={7} fill="#ff5c8a" />
    </Sprite>
  );
}

function Data() {
  const cyl = (x: number, y: number, color: string, name?: string) => {
    const [bx, by] = iso(x, y, -0.7);
    const [, ty] = iso(x, y, 0.15);
    const rx = 26;
    const ry = 13;
    return (
      <g key={`${x}-${y}`} data-layer={name}>
        <path d={`M${bx - rx} ${ty} V${by} A${rx} ${ry} 0 0 0 ${bx + rx} ${by} V${ty} Z`} fill={color} />
        <path d={`M${bx - rx} ${(ty + by) / 2} A${rx} ${ry} 0 0 0 ${bx + rx} ${(ty + by) / 2}`} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2.5} />
        <ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill="#fff" opacity={0.85} />
        <ellipse cx={bx} cy={ty} rx={rx - 6} ry={ry - 3} fill={color} opacity={0.55} />
      </g>
    );
  };
  const pipe = (a: [number, number], b: [number, number]) => {
    const [x1, y1] = iso(a[0], a[1], -0.7);
    const [x2, y2] = iso(b[0], b[1], -0.7);
    return <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#c9b48f" strokeWidth={6} strokeLinecap="round" />;
  };
  return (
    <Sprite name="data" b={DATA_BOX}>
      <Block b={[0.25, 0.25, -1.7, 6.75, 6.75, -0.7]} c={['#efe8dd', '#ddd2c2', '#c8bba8']} />
      <path d={`M${iso(0.25, 6.75, -1.2).join(' ')} L${iso(6.75, 6.75, -1.2).join(' ')} L${iso(6.75, 0.25, -1.2).join(' ')}`} fill="none" stroke="#b9ab96" strokeWidth={2} />
      {pipe([1.8, 1.8], [5.2, 5.2])}
      {pipe([5.2, 1.8], [5.2, 5.2])}
      {pipe([1.3, 5.3], [5.2, 5.2])}
      {cyl(1.8, 1.8, '#22c3a6')}
      {cyl(5.2, 1.8, '#ffb02e')}
      {cyl(1.3, 5.3, '#ff5c8a')}
      {cyl(5.2, 5.2, '#6d4aff', 'db-main')}
    </Sprite>
  );
}

function Infra() {
  const cable = (pts: [number, number][], color: string, cls: string) => (
    <path
      className={cls}
      d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${iso(x, y, -1.7).join(' ')}`).join(' ')}
      fill="none"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const rack = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <Block b={[x, y, -1.7, x + 0.7, y + 0.5, -1.05]} c={['#3f4366', '#2c2f4a', '#23253a']} />
      {[0, 1, 2].map((i) => {
        const [lx, ly] = iso(x + 0.15 + i * 0.18, y + 0.5, -1.4);
        return <circle key={i} className="v21-led" cx={lx} cy={ly} r={3.2} fill={i === 1 ? '#ff7aa8' : '#7cf2d0'} />;
      })}
    </g>
  );
  return (
    <Sprite name="infra" b={INFRA_BOX}>
      <Block b={[0.5, 0.5, -2.5, 6.5, 6.5, -1.7]} c={['#2d3047', '#23253a', '#1b1d2e']} />
      {[1.5, 2.5, 3.5, 4.5, 5.5].map((t) => (
        <g key={t} stroke="#3a3e5e" strokeWidth={1.5}>
          <path d={`M${iso(t, 0.5, -1.7).join(' ')} L${iso(t, 6.5, -1.7).join(' ')}`} />
          <path d={`M${iso(0.5, t, -1.7).join(' ')} L${iso(6.5, t, -1.7).join(' ')}`} />
        </g>
      ))}
      {cable([[0.8, 3.5], [3.5, 3.5], [3.5, 0.8]], '#7cf2d0', 'v21-cable')}
      {cable([[3.5, 3.5], [6.2, 3.5], [6.2, 5.6], [1.3, 5.6]], '#ff7aa8', 'v21-cable v21-cable--b')}
      {cable([[3.5, 3.5], [3.5, 6.2]], '#7cf2d0', 'v21-cable')}
      {rack(1.0, 1.2)}
      {rack(4.6, 1.0)}
      {rack(0.95, 4.95)}
      {rack(4.7, 4.6)}
      {[...Array(6)].map((_, i) => {
        const [vx, vy] = iso(1 + i * 0.95, 6.5, -2.2);
        return <rect key={i} x={vx - 14} y={vy - 4} width={26} height={7} rx={3} fill="#151626" transform={`rotate(-30 ${vx} ${vy})`} />;
      })}
    </Sprite>
  );
}

function Plan() {
  const lines: string[] = [];
  lines.push(poly([[0, 0, 0], [7, 0, 0], [7, 7, 0], [0, 7, 0]]));
  ROADS.forEach((r) => lines.push(faces(...r).top));
  THINGS.forEach((t) => t.wire.forEach((w) => lines.push(w)));
  const note = (x: number, y: number, text: string) => {
    const [nx, ny] = iso(x, y, 0);
    return (
      <text x={nx} y={ny} className="v21-note" textAnchor="middle">
        {text}
      </text>
    );
  };
  const grid: ReactNode[] = [];
  for (let t = 0; t <= 7; t++) {
    grid.push(<path key={`a${t}`} d={`M${iso(t, -0.4).join(' ')} L${iso(t, 7.4).join(' ')}`} />);
    grid.push(<path key={`b${t}`} d={`M${iso(-0.4, t).join(' ')} L${iso(7.4, t).join(' ')}`} />);
  }
  return (
    <Sprite name="plan" b={PLAN_BOX}>
      <polygon data-layer="plan-sheet" points={poly([[-0.4, -0.4, 0], [7.4, -0.4, 0], [7.4, 7.4, 0], [-0.4, 7.4, 0]])} fill="#2456e8" />
      <g data-layer="plan-grid" stroke="rgba(255,255,255,0.16)" strokeWidth={1.2}>
        {grid}
      </g>
      <g fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round">
        {lines.map((p, i) => (
          <polygon key={i} data-layer="plan-line" points={p} />
        ))}
      </g>
      <g data-layer="plan-notes">
        {note(3.5, 1.0, 'services/')}
        {note(1.0, 3.5, 'ui/')}
        {note(6.0, 6.05, 'data/')}
        {note(3.5, 6.0, 'access/')}
      </g>
    </Sprite>
  );
}

function Signals() {
  const house = iso(0.8, 6.5, 0.1);
  const houseGround = iso(0.8, 6.5, 0);
  const gate = iso(2.3, 4.7, 0);
  const gateData = iso(2.3, 4.7, -0.7);
  const dbTop = iso(5.2, 5.2, 0.15);
  const hall = iso(3.5, 3.5, 0.5);
  const rack = iso(1.3, 5.3, -1.05);
  const dbPink = iso(1.3, 5.3, -0.7);
  const v = (x: number, y1: number, y2: number, color: string, key: string) => (
    <path key={key} data-layer="beam" d={`M${x} ${y1} L${x} ${y2}`} stroke={color} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" />
  );
  return (
    <Layer name="signals" w={W} h={H}>
      <svg className="art" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {v(house[0], house[1] + SPLIT.city, houseGround[1] + SPLIT.ground, '#6d4aff', 'b1')}
        {v(gate[0], gate[1] + SPLIT.ground, gateData[1] + SPLIT.data, '#22c3a6', 'b2')}
        {v(dbTop[0], dbTop[1] + SPLIT.data, hall[1] + SPLIT.city, '#ffb02e', 'b3')}
        {v(rack[0], rack[1] + SPLIT.infra, dbPink[1] + SPLIT.data, '#ff7aa8', 'b4')}
      </svg>
    </Layer>
  );
}

/** Dashed lines between the corners of the separated layers, like an exploded diagram. */
function Guides() {
  const pairs: [P3, number, P3, number][] = [];
  const three = (a: number, b: number): [number, number][] => [
    [a, b],
    [b, b],
    [b, a],
  ];
  three(0, 7).forEach(([x, y]) => pairs.push([[x, y, -0.12], SPLIT.city, [x, y, 0], SPLIT.ground]));
  three(0.25, 6.75).forEach(([x, y]) => pairs.push([[x, y, -0.7], SPLIT.ground, [x, y, -0.7], SPLIT.data]));
  three(0.5, 6.5).forEach(([x, y]) => pairs.push([[x, y, -1.7], SPLIT.data, [x, y, -1.7], SPLIT.infra]));
  return (
    <Layer name="guides" w={W} h={H}>
      <svg className="art" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {pairs.map(([a, da, b, db], i) => {
          const [x1, y1] = iso(...a);
          const [x2, y2] = iso(...b);
          return <path key={i} data-layer="guide" d={`M${x1} ${y1 + da} L${x2} ${y2 + db}`} stroke="#b9adf5" strokeWidth={2.5} strokeDasharray="6 9" strokeLinecap="round" />;
        })}
      </svg>
    </Layer>
  );
}

const PLATE_BOX = bbox(corners(-0.05, -0.05, -0.12, 7.05, 7.05, 0));

// the path a citizen's request takes, in the separated layout
const REQ_A = [iso(0.8, 6.5, 0.1), iso(0.8, 6.5, 0), iso(0.8, 4.7, 0), iso(2.3, 4.7, 0)].map(([x, y], i) => ({ x, y: y + (i === 0 ? SPLIT.city : SPLIT.ground) }));
const REQ_B = [iso(2.3, 4.7, 0), iso(2.3, 4.7, -0.7), iso(2.3, 5.2, -0.7), iso(5.2, 5.2, -0.7)].map(([x, y], i) => ({ x, y: y + (i === 0 ? SPLIT.ground : SPLIT.data) }));
const REQ_C = [iso(5.2, 5.2, 0.15), iso(3.5, 3.5, 0.5)].map(([x, y], i) => ({ x, y: y + (i === 0 ? SPLIT.data : SPLIT.city) }));
const POWER = [iso(1.3, 5.3, -1.05), iso(1.3, 5.3, -0.7)].map(([x, y], i) => ({ x, y: y + (i === 0 ? SPLIT.infra : SPLIT.data) }));

interface LayerLabel {
  name: string;
  title: string;
  note: string;
  tools: string[];
  side: 'left' | 'right';
  anchor: [number, number];
}

const LABELS: LayerLabel[] = [
  { name: 'label-city', title: 'Interface', note: 'what citizens use', tools: ['React', 'TypeScript'], side: 'right', anchor: [iso(7, 0, 1.4)[0], iso(7, 0, 1.4)[1] + SPLIT.city] },
  { name: 'label-ground', title: 'Services & API', note: 'rules and access (RBAC)', tools: ['Node.js', 'Express', 'Spring Boot'], side: 'left', anchor: [iso(0, 7, 0)[0], iso(0, 7, 0)[1] + SPLIT.ground] },
  { name: 'label-data', title: 'Data', note: 'every request saved', tools: ['PostgreSQL', 'Firebase'], side: 'right', anchor: [iso(6.75, 0.25, -0.7)[0], iso(6.75, 0.25, -0.7)[1] + SPLIT.data] },
  { name: 'label-infra', title: 'Infrastructure', note: 'servers and network', tools: ['Docker', 'Linux'], side: 'left', anchor: [iso(0.5, 6.5, -1.7)[0], iso(0.5, 6.5, -1.7)[1] + SPLIT.infra] },
];

function Label({ l }: { l: LayerLabel }) {
  const w = 520;
  const h = 124;
  const x = l.side === 'right' ? l.anchor[0] + 70 : l.anchor[0] - 70 - w;
  const y = l.anchor[1] - h / 2;
  return (
    <Layer name={l.name} x={x} y={y} w={w} h={h} className={`v21-label v21-label--${l.side}`}>
      <strong>{l.title}</strong>
      <small>{l.note}</small>
      <span className="v21-label__tools">
        {l.tools.map((t) => (
          <TechGlyph key={t} name={t} size={36} />
        ))}
      </span>
    </Layer>
  );
}

export function Scene() {
  const build = ({ tl, L, q, say }: StoryKit) => {
    const cam = L('camera');
    const view = (cx: number, cy: number, z: number, at: number, d = 1.2, ease = 'power2.inOut') => shot(tl, cam, cx, cy, z, at, d, ease, [W, H]);
    const buildings = THINGS.filter((t) => !t.tree).map((t) => L(t.name)[0]);
    const trees = THINGS.filter((t) => t.tree).map((t) => L(t.name)[0]);

    // ---------- starting state: only the blueprint ----------
    view(800, 450, 1.36, 0, 0);
    tl.set(L('plan'), { autoAlpha: 1 }, 0);
    tl.set(L('plan-sheet'), { scaleY: 0, transformOrigin: '50% 50%' }, 0);
    tl.set(L('plan-grid'), { autoAlpha: 0 }, 0);
    tl.set(L('plan-line'), { drawSVG: '0%' }, 0);
    tl.set(L('plan-notes'), { autoAlpha: 0 }, 0);
    tl.set([L('ground'), L('data'), L('infra'), L('clouds'), L('shadow')], { autoAlpha: 0 }, 0);
    tl.set([L('city'), L('ground'), L('data'), L('infra')], { y: 0 }, 0);
    tl.set([L('data'), L('infra')], { y: 70 }, 0);
    tl.set(buildings, { scaleY: 0, autoAlpha: 0 }, 0);
    tl.set(trees, { scale: 0, autoAlpha: 0 }, 0);
    tl.set([L('signals'), L('pulse-a'), L('pulse-b'), L('pulse-c'), L('pulse-p'), L('resolved'), L('plate'), ...LABELS.map((l) => L(l.name)[0])], { autoAlpha: 0 }, 0);
    tl.set(L('guide'), { drawSVG: '0%' }, 0);
    tl.set(L('beam'), { drawSVG: '0%' }, 0);
    tl.set(L('gate-light'), { fill: '#ff5c8a' }, 0);
    ['pulse-a', 'pulse-b', 'pulse-c', 'pulse-p'].forEach((p) => tl.set(L(p), { x: 0, y: 0, xPercent: -50, yPercent: -50 }, 0));

    // ---------- 1. a blueprint ----------
    say(0.2, 'Every system starts as a blueprint.');
    tl.to(L('plan-sheet'), { scaleY: 1, duration: 0.6, ease: 'power3.out' }, 0.2);
    tl.to(L('plan-grid'), { autoAlpha: 1, duration: 0.4 }, 0.5);
    tl.to(L('plan-line'), { drawSVG: '100%', duration: 1.4, stagger: 0.03, ease: 'power1.inOut' }, 0.6);
    tl.to(L('plan-notes'), { autoAlpha: 1, duration: 0.4 }, 1.6);

    // ---------- 2. built block by block ----------
    const make = 2.7;
    say(make, 'Then it’s built, block by block.');
    view(800, 462, 1.28, make, 1.6);
    tl.to([L('infra'), L('data')], { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' }, make);
    tl.to(L('ground'), { autoAlpha: 1, duration: 0.5 }, make + 0.2);
    tl.to(L('plan-sheet'), { autoAlpha: 0, duration: 0.5 }, make + 0.3);
    tl.to(L('plan-grid'), { autoAlpha: 0, duration: 0.4 }, make + 0.3);
    tl.to(buildings, { autoAlpha: 1, duration: 0.15, stagger: 0.14 }, make + 0.45);
    tl.to(buildings, { scaleY: 1, duration: 0.55, stagger: 0.14, ease: 'back.out(1.6)' }, make + 0.45);
    tl.to(L('plan-line'), { autoAlpha: 0, duration: 0.5 }, make + 0.9);
    tl.to(L('plan-notes'), { autoAlpha: 0, duration: 0.3 }, make + 0.5);
    tl.to(trees, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(2.4)' }, make + 1.3);
    tl.to([L('clouds'), L('shadow')], { autoAlpha: 1, duration: 0.8 }, make + 1.4);

    // ---------- 3. it separates into layers ----------
    const split = 5.4;
    say(split, 'Underneath, the city is a machine made of layers.');
    view(800, 520, 0.72, split, 1.6);
    tl.to(L('plate'), { autoAlpha: 1, duration: 0.4 }, split + 0.1);
    tl.to(L('city'), { y: SPLIT.city, duration: 1.4, ease: 'power3.inOut' }, split + 0.1);
    tl.to(L('guide'), { drawSVG: '100%', duration: 0.8, stagger: 0.05 }, split + 1.1);
    tl.to(L('data'), { y: SPLIT.data, duration: 1.4, ease: 'power3.inOut' }, split + 0.2);
    tl.to(L('infra'), { y: SPLIT.infra, duration: 1.4, ease: 'power3.inOut' }, split + 0.3);

    // ---------- 4. each layer, on its own ----------
    const float = split + 1.7;
    say(float, 'Interface, services, data, infrastructure: each layer has one job.');
    LABELS.forEach((l, i) => {
      const el = L(l.name)[0];
      tl.to(el, { autoAlpha: 1, duration: 0.4 }, float + i * 0.25);
      tl.fromTo(el, { x: l.side === 'right' ? -24 : 24 }, { x: 0, duration: 0.5, ease: 'power2.out' }, float + i * 0.25);
    });
    // a gentle independent float
    tl.to(L('city'), { y: SPLIT.city - 10, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, float);
    tl.to(L('data'), { y: SPLIT.data + 8, duration: 1.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, float + 0.3);
    tl.to(L('infra'), { y: SPLIT.infra - 8, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, float + 0.15);

    // ---------- 5. the layers talk ----------
    const talk = float + 2.6;
    say(talk, 'A citizen sends a request, and the layers pass it along.');
    tl.set(L('signals'), { autoAlpha: 1 }, talk);
    tl.to(L('beam'), { drawSVG: '100%', duration: 0.6, stagger: 0.15 }, talk);
    tl.set(L('pulse-a'), { autoAlpha: 1, x: REQ_A[0].x, y: REQ_A[0].y }, talk + 0.4);
    tl.to(L('pulse-a'), { motionPath: { path: REQ_A.slice(1), curviness: 0 }, duration: 1.2, ease: 'none' }, talk + 0.4);
    tl.set(L('pulse-a'), { autoAlpha: 0 }, talk + 1.6);
    tl.to(L('gate-light'), { fill: '#22c3a6', duration: 0.2 }, talk + 1.55);
    tl.set(L('pulse-b'), { autoAlpha: 1, x: REQ_B[0].x, y: REQ_B[0].y }, talk + 1.6);
    tl.to(L('pulse-b'), { motionPath: { path: REQ_B.slice(1), curviness: 0 }, duration: 0.9, ease: 'none' }, talk + 1.6);
    tl.set(L('pulse-b'), { autoAlpha: 0 }, talk + 2.5);
    tl.fromTo(q('[data-layer="db-main"] path'), { opacity: 1 }, { opacity: 0.55, duration: 0.15, yoyo: true, repeat: 3 }, talk + 2.4);
    tl.set(L('pulse-c'), { autoAlpha: 1, x: REQ_C[0].x, y: REQ_C[0].y }, talk + 2.55);
    tl.to(L('pulse-c'), { motionPath: { path: REQ_C.slice(1), curviness: 0 }, duration: 0.7, ease: 'power1.in' }, talk + 2.55);
    tl.set(L('pulse-c'), { autoAlpha: 0 }, talk + 3.25);
    [0, 0.8, 1.6].forEach((d) => {
      tl.set(L('pulse-p'), { autoAlpha: 1, x: POWER[0].x, y: POWER[0].y }, talk + 0.3 + d);
      tl.to(L('pulse-p'), { x: POWER[1].x, y: POWER[1].y, duration: 0.6, ease: 'none' }, talk + 0.3 + d);
      tl.set(L('pulse-p'), { autoAlpha: 0 }, talk + 0.9 + d);
    });
    pop(tl, L('resolved'), talk + 3.25, { origin: '50% 100%', ease: 'back.out(2.2)' });

    // ---------- 6. back together ----------
    const join = talk + 4.4;
    say(join, 'From blueprint to a city that works.');
    tl.to([L('signals'), L('resolved'), ...LABELS.map((l) => L(l.name)[0])], { autoAlpha: 0, duration: 0.4 }, join - 0.2);
    tl.to(L('guide'), { drawSVG: '0%', duration: 0.4 }, join - 0.2);
    tl.to(L('plate'), { autoAlpha: 0, duration: 0.4 }, join + 0.8);
    tl.to(L('city'), { y: 0, duration: 1.2, ease: 'back.inOut(1.2)' }, join);
    tl.to(L('data'), { y: 0, duration: 1.2, ease: 'back.inOut(1.2)' }, join + 0.08);
    tl.to(L('infra'), { y: 0, duration: 1.2, ease: 'back.inOut(1.2)' }, join + 0.16);
    view(800, 462, 1.28, join, 1.4);
    tl.set({}, {}, join + 2.6);
  };

  const hall = iso(3.5, 3.5, 2.6);

  return (
    <StoryStage
      className="v21-stage"
      look="bare"
      width={W}
      height={H}
      title="The Architecture Machine"
      logline="A city that is really a system in layers, from blueprint to finished platform."
      label="Animation: a blueprint of a small city draws itself, then the city is built from it with City Hall in the middle. The city separates into floating layers labelled interface, services and access, data and infrastructure, each with the tools Matt uses. A citizen's request travels down through the layers and back to City Hall, and the layers come back together into the finished city."
      build={build}
    >
      <Layer name="shadow" x={360} y={790} w={880} h={120} className="v21-shadow" />
      <Layer name="clouds" w={W} h={H} className="v21-clouds">
        <svg className="art" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <path d="M250 560 C215 560 212 520 248 518 C255 482 305 474 322 504 C338 470 400 474 406 512 C440 504 466 532 452 560 Z" fill="#fff" stroke="#eceaf6" strokeWidth={3} />
          <path d="M1210 250 C1182 250 1180 218 1210 216 C1216 188 1256 182 1270 206 C1284 180 1332 184 1336 214 C1364 208 1384 230 1372 250 Z" fill="#fff" stroke="#eceaf6" strokeWidth={3} />
          <path d="M1260 700 C1236 700 1234 672 1260 670 C1266 646 1300 640 1312 662 C1324 638 1366 642 1370 668 C1394 664 1410 682 1400 700 Z" fill="#fff" stroke="#eceaf6" strokeWidth={3} />
        </svg>
      </Layer>
      <Infra />
      <Data />
      <Ground />
      <Plan />
      <Layer name="city" w={W} h={H}>
        <Sprite name="plate" b={PLATE_BOX}>
          <Block b={[-0.05, -0.05, -0.12, 7.05, 7.05, 0]} c={['rgba(255,255,255,0.72)', 'rgba(124,92,255,0.35)', 'rgba(91,63,214,0.4)']} edge="#c9bdff" />
        </Sprite>
        {THINGS.map((t) => (
          <Sprite key={t.name} name={t.name} b={t.box} origin={t.base}>
            {t.node}
          </Sprite>
        ))}
        <Layer name="resolved" x={hall[0] - 150} y={hall[1] - 150} w={300} h={64} className="v21-badge">
          <span>✓ Request resolved</span>
        </Layer>
      </Layer>
      <Guides />
      <Signals />
      {['pulse-a', 'pulse-b', 'pulse-c', 'pulse-p'].map((p) => (
        <Layer key={p} name={p} w={30} h={30} className={`v21-pulse v21-${p}`} />
      ))}
      {LABELS.map((l) => (
        <Label key={l.name} l={l} />
      ))}
    </StoryStage>
  );
}
