import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cx } from '../lib/env';
import { useStory, type StoryKit } from './useStory';
import './story.css';

export type FrameLook = 'mat' | 'window' | 'bezel' | 'paper' | 'pixel' | 'glass' | 'bare';

export interface StoryStageProps {
  /** Episode title, e.g. "Hello, World" (read by screen readers, and shown in the window bar). */
  title: string;
  /** One line about the story, read by screen readers after the title. */
  logline?: string;
  /** Text read by screen readers instead of the animation. */
  label: string;
  build: (kit: StoryKit) => void;
  /** Layers placed on the drawing canvas (1600x1000 by default), scaled to fit the frame. */
  children?: ReactNode;
  /** Content that fills the viewport without scaling (a three.js canvas). */
  fill?: ReactNode;
  width?: number;
  height?: number;
  look?: FrameLook;
  /** Title in the window bar (look="window"). */
  windowTitle?: string;
  className?: string;
  style?: CSSProperties;
  /** Seconds before the story starts. */
  delay?: number;
  captions?: boolean;
}

/**
 * The framed animation: a 3D border on the white page (never full width),
 * a scaled drawing canvas, captions like film subtitles and one round button
 * under them (pause, play or replay). The story plays by itself when the
 * page opens.
 */
export function StoryStage({
  title,
  logline,
  label,
  build,
  children,
  fill,
  width = 1600,
  height = 1000,
  look = 'mat',
  windowTitle,
  className,
  style,
  delay,
  captions = true,
}: StoryStageProps) {
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const { state, toggle, replay } = useStory(root, { caption, progress }, build, { delay });

  useLayoutEffect(() => {
    const box = viewport.current;
    const art = canvas.current;
    if (!box || !art) return;
    const fit = () => {
      const s = box.offsetWidth / width;
      art.style.transform = `scale(${s.toFixed(5)})`;
      box.style.setProperty('--stage-scale', s.toFixed(5));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width]);

  // One round button: pause while the story plays ("ready" is the half second
  // before the autoplay starts), play while it is paused, replay once it has ended.
  const action =
    state === 'ended'
      ? { label: 'Replay animation', run: replay, icon: <RotateCcw size={12} strokeWidth={3} aria-hidden="true" /> }
      : state === 'paused'
        ? { label: 'Play animation', run: toggle, icon: <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" /> }
        : { label: 'Pause animation', run: toggle, icon: <Pause size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" /> };

  return (
    <figure
      ref={root}
      className={cx('story', `story--${look}`, className)}
      data-state={state}
      style={{ '--stage-ratio': `${width} / ${height}`, ...style } as CSSProperties}
    >
      <div className="story__frame">
        {look === 'window' && (
          <div className="story__bar" aria-hidden="true">
            <span className="story__lights">
              <i />
              <i />
              <i />
            </span>
            <span className="story__wtitle">{windowTitle ?? `${title}.mp4`}</span>
          </div>
        )}
        <div className="story__viewport" ref={viewport} role="img" aria-label={label}>
          <div className="story__canvas" ref={canvas} style={{ width, height }}>
            {/* scenes can move or zoom this like a film camera: L('camera') */}
            <div className="story__camera" data-layer="camera" style={{ width, height }}>
              {children}
            </div>
          </div>
          {fill && <div className="story__fill">{fill}</div>}
          {captions && (
            <div className="story__subs" aria-hidden="true">
              <p className="story__caption" ref={caption} />
            </div>
          )}
          <div className="story__progress" aria-hidden="true">
            <div className="story__progress-fill" ref={progress} />
          </div>
        </div>
      </div>
      <figcaption className="story__toolbar">
        {/* the title is kept for screen readers only */}
        <span className="visually-hidden">
          {title}
          {logline ? `: ${logline}` : ''}
        </span>
        <button type="button" className="story__play" onClick={action.run} aria-label={action.label} title={action.label}>
          {action.icon}
        </button>
      </figcaption>
    </figure>
  );
}
