import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../../lib/env';

export interface LayerProps {
  /** Name used by the timeline: [data-layer="name"]. */
  name: string;
  /** Image for this layer (SVG/PNG/WebP). Omit to use children only. */
  src?: string;
  /** Position and size on the scene canvas, in canvas pixels. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  z?: number;
  /** transform-origin, e.g. '50% 100%' for things that fold up from the ground. */
  origin?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** One image in a scene. Scenes are stacks of these, moved only with transforms. */
export function Layer({ name, src, x = 0, y = 0, w, h, z, origin, className, style, children }: LayerProps) {
  const box: CSSProperties = { left: x, top: y, width: w, height: h, zIndex: z, transformOrigin: origin, ...style };
  if (src && !children) {
    return (
      <img
        className={cx('layer', className)}
        data-layer={name}
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        style={box}
      />
    );
  }
  return (
    <div className={cx('layer', className)} data-layer={name} style={box}>
      {src && <img className="layer__img" src={src} alt="" draggable={false} decoding="async" />}
      {children}
    </div>
  );
}
