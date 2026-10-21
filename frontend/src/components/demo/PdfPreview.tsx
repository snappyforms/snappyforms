'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';

/** Render the actual PDF in-app, including AcroForm appearances, without
 * depending on the browser having a built-in PDF plug-in. */
export default function PdfPreview({ src, fullScreen = false, zoom = 1 }: {
  src: string; fullScreen?: boolean; zoom?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    setLoading(true);
    setError(false);
    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        task = pdfjs.getDocument({ url: src });
        const document = await task.promise;
        const pages = window.document.createDocumentFragment();
        for (let n = 1; n <= document.numPages; n++) {
          if (cancelled) return;
          const page = await document.getPage(n);
          const canvas = window.document.createElement('canvas');
          const viewport = page.getViewport({ scale: fullScreen ? 2.5 : 1.7 });
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `PA-1938 page ${n} of ${document.numPages}. Current form answers are shown in the review fields.`);
          await page.render({ canvas, viewport }).promise;
          pages.appendChild(canvas);
        }
        if (!cancelled) host.current?.replaceChildren(pages);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void render();
    return () => { cancelled = true; void task?.destroy(); };
  }, [src, fullScreen]);
  return <div className={`sf-pdf-preview ${fullScreen ? 'sf-pdf-preview-full' : ''}`} aria-busy={loading}>
    {loading && <p className="sf-pdf-loading" role="status">Rendering your PDF…</p>}
    {error && <p role="alert">Unable to render this preview. <a href={src} target="_blank" rel="noreferrer">Open the PDF in a new tab</a>, or refresh the preview.</p>}
    <div className="sf-pdf-pages" ref={host} style={{ width: `${zoom * 100}%` }}/>
  </div>;
}
