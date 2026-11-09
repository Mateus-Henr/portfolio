import type { CareerStep, Certificate } from '../content';
import { STRINGS, type Lang } from '../i18n';

/** "2019-02" → "Feb 2019" (or "fev 2019" in Portuguese). */
export function monthYear(value: string, lang: Lang = 'en') {
  const [y, m] = value.split('-').map(Number);
  return m ? `${STRINGS[lang].dates.months[m - 1]} ${y}` : String(y);
}

/** "Feb 2019 – Dec 2020", "Mar 2025" or "May 2025 – now". */
export function stepDates(step: CareerStep, lang: Lang = 'en') {
  if (!step.end) return `${monthYear(step.start, lang)} – ${STRINGS[lang].dates.now}`;
  if (step.end === step.start) return monthYear(step.start, lang);
  return `${monthYear(step.start, lang)} – ${monthYear(step.end, lang)}`;
}

/** "2019 – 2020", "2025" or "2025 – now". */
export function stepYears(step: CareerStep, lang: Lang = 'en') {
  const a = step.start.slice(0, 4);
  if (!step.end) return `${a} – ${STRINGS[lang].dates.now}`;
  const b = step.end.slice(0, 4);
  return a === b ? a : `${a} – ${b}`;
}

/**
 * Google Drive share links can't be framed, but their /preview twin can.
 * Returns null for links that refuse to be shown inside the popup.
 */
export function embedUrl(cert: Certificate): string | null {
  if (!cert.file) return null;
  const drive = cert.file.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  if (cert.file.startsWith('/') || cert.file.startsWith('./') || !/^https?:/.test(cert.file)) return cert.file;
  return null;
}

/** Sum of course hours, e.g. 303.5 ("80.5 h" and "80,5 h" both count). */
export function totalHours(certs: Certificate[]) {
  return certs
    .filter((c) => c.kind === 'course' && c.hours)
    .reduce((sum, c) => sum + parseFloat(c.hours!.replace(',', '.')), 0);
}
