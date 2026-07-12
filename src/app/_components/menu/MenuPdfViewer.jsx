"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function useContainerWidth(active) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!active) return;

    const node = ref.current;
    if (!node) return;

    const update = () => {
      const next = node.clientWidth;
      setWidth(next > 0 ? next : 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, [active]);

  return { ref, width };
}

const MenuPdfViewer = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const viewerReady = !loading && Boolean(menu?.fileUrl);
  const { ref: containerRef, width: pageWidth } = useContainerWidth(viewerReady);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/menu");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Impossible de charger le menu.");
        }

        if (!cancelled) {
          setMenu(data.menu || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Erreur réseau.");
          setMenu(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
  }, []);

  if (loading) {
    return (
      <div className="tst-menu-pdf tst-menu-pdf--fullscreen tst-menu-pdf--loading" role="status">
        <div className="tst-menu-pdf__loader-card">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement de la carte…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tst-menu-pdf tst-menu-pdf--fullscreen tst-menu-pdf--empty">
        <div className="tst-menu-pdf__loader-card">
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!menu?.fileUrl) {
    return (
      <div className="tst-menu-pdf tst-menu-pdf--fullscreen tst-menu-pdf--empty">
        <div className="tst-menu-pdf__loader-card">
          <i className="fas fa-utensils" aria-hidden="true" />
          <h3>Le menu sera bientôt disponible.</h3>
          <p>Notre carte est en cours de mise à jour. Revenez très prochainement.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="tst-menu-pdf tst-menu-pdf--fullscreen" aria-label="Carte menu">
      <div className="tst-menu-pdf__canvas">
        <div className="tst-menu-pdf__inner" ref={containerRef}>
          <Document
          key={menu.updatedAt || menu.id}
          file={menu.fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="tst-menu-pdf__doc-loading">
              <i className="fas fa-spinner fa-spin" aria-hidden="true" />
            </div>
          }
          error={
            <div className="tst-menu-pdf__loader-card">
              <p>Impossible d&apos;afficher le PDF.</p>
            </div>
          }
        >
          {pageWidth > 0 &&
            Array.from({ length: numPages }, (_, index) => (
              <div key={`menu-page-${index + 1}`} className="tst-menu-pdf__page">
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>

      <a
        href={menu.fileUrl}
        download={menu.fileName || "carte-menu.pdf"}
        className="tst-menu-pdf__fab"
        aria-label="Télécharger le menu"
        title="Télécharger le menu"
      >
        <i className="fas fa-download" aria-hidden="true" />
      </a>
    </section>
  );
};

export default MenuPdfViewer;
