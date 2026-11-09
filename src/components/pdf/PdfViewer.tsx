import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { cx } from '../../lib/env';
import './pdf.css';

export interface PdfDocument {
  title: string;
  src: string;
  subtitle?: string;
  /** Link for the "open in a new tab" button (defaults to src). */
  href?: string;
}

export type PdfLook = 'sheet' | 'window' | 'ticket';

const PdfContext = createContext<{ open: (doc: PdfDocument) => void }>({ open: () => {} });

export const usePdfViewer = () => useContext(PdfContext);

/**
 * Popup PDF viewer for certificates. Uses the native <dialog> element, so Esc,
 * focus trapping and the backdrop come from the browser. Clicking outside the
 * panel closes it too.
 */
export function PdfViewerProvider({ look = 'sheet', children }: { look?: PdfLook; children: ReactNode }) {
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (doc && !dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add('is-modal-open');
    }
  }, [doc]);

  const close = useCallback(() => dialogRef.current?.close(), []);
  const value = useMemo(() => ({ open: setDoc }), []);

  return (
    <PdfContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className={cx('pdf', `pdf--${look}`)}
        aria-label={doc?.title ?? 'Certificate'}
        onClose={() => {
          setDoc(null);
          document.documentElement.classList.remove('is-modal-open');
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {doc && (
          <div className="pdf__panel">
            <header className="pdf__bar">
              {look === 'window' && (
                <span className="pdf__lights" aria-hidden="true">
                  <button type="button" className="pdf__light pdf__light--red" onClick={close} tabIndex={-1} />
                  <i className="pdf__light pdf__light--amber" />
                  <i className="pdf__light pdf__light--green" />
                </span>
              )}
              <div className="pdf__heading">
                <p className="pdf__title">{doc.title}</p>
                {doc.subtitle && <p className="pdf__subtitle">{doc.subtitle}</p>}
              </div>
              <a className="pdf__btn" href={doc.href ?? doc.src} target="_blank" rel="noreferrer" aria-label="Open in a new tab">
                <ExternalLink size={17} />
              </a>
              <button type="button" className="pdf__btn" onClick={close} aria-label="Close">
                <X size={19} />
              </button>
            </header>
            <iframe
              className="pdf__frame"
              src={/^https?:/.test(doc.src) ? doc.src : `${doc.src}#view=FitH&toolbar=0`}
              title={doc.title}
              allow="autoplay"
            />
          </div>
        )}
      </dialog>
    </PdfContext.Provider>
  );
}
