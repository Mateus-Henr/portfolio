import '@fontsource-variable/orbitron';
import { cx } from '../lib/env';
import face from './assets/matt-face.png';

/** Matt's face, cropped from me-ghibli.png. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return <img className={cx('logo-mark', className)} src={face} width={size} height={size} alt="" aria-hidden="true" decoding="async" />;
}

/** The face with "Matt" set in Orbitron to its right. */
export function Logo({ name, size = 34, className }: { name: string; size?: number; className?: string }) {
  return (
    <span className={cx('logo', className)}>
      <LogoMark size={size} />
      <span className="logo__name">{name}</span>
    </span>
  );
}
