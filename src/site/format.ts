import type { CareerStep, Certificate } from '../content';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2019-02" → "Feb 2019". */
export function monthYear(value: string) {
  const [y, m] = value.split('-').map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : String(y);
}

/** "Feb 2019 – Dec 2020", "Mar 2025" or "May 2025 – now". */
export function stepDates(step: CareerStep) {
  if (!step.end) return `${monthYear(step.start)} – now`;
  if (step.end === step.start) return monthYear(step.start);
  return `${monthYear(step.start)} – ${monthYear(step.end)}`;
}

/** "2019 – 2020", "2025" or "2025 – now". */
export function stepYears(step: CareerStep) {
  const a = step.start.slice(0, 4);
  if (!step.end) return `${a} – now`;
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

/** Sum of course hours, e.g. 303.5. */
export function totalHours(certs: Certificate[]) {
  return certs
    .filter((c) => c.kind === 'course' && c.hours)
    .reduce((sum, c) => sum + parseFloat(c.hours!.replace(',', '.')), 0);
}
