"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Data from "@data/sections/visit-360.json";

function useInView(ref, { rootMargin = "200px" } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

const Visit360Section = () => {
  const shellRef = useRef(null);
  const inView = useInView(shellRef, { rootMargin: "250px" });
  const [activated, setActivated] = useState(false);

  const shouldLoad = inView || activated;

  const tourUrl = useMemo(() => {
    const raw = (Data.tourUrl || "").toString().trim();
    if (!raw.startsWith("/visite-360/")) return "";
    return raw;
  }, []);

  return (
    <section className="tst-visit360" ref={shellRef} aria-label="Visite 360 degrés">
      <div className="row align-items-center">
        <div className="col-lg-6">
          <div className="tst-visit360__copy tst-mb-60">
            <div
              className="tst-suptitle tst-mb-15"
              dangerouslySetInnerHTML={{ __html: Data.subtitle }}
            />
            <h3
              className="tst-mb-30"
              dangerouslySetInnerHTML={{ __html: Data.title }}
            />
            <p
              className="tst-text tst-mb-30"
              dangerouslySetInnerHTML={{ __html: Data.description }}
            />

            <div className="tst-visit360__actions">
              {tourUrl ? (
                <a
                  className="tst-btn"
                  href={tourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-external-link-alt" aria-hidden="true" />
                  {Data.cta?.secondaryLabel || "Ouvrir en plein écran"}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="tst-visit360__frame tst-mb-60">
            {!shouldLoad ? (
              <div className="tst-visit360__poster" role="img" aria-label={Data.poster?.alt}>
                <img
                  src={Data.poster?.url}
                  alt={Data.poster?.alt || "Aperçu"}
                  className="tst-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="tst-overlay" />
                <button
                  type="button"
                  className="tst-visit360__play"
                  onClick={() => setActivated(true)}
                  disabled={!tourUrl}
                  aria-label={Data.cta?.posterLabel || "Lancer la visite 360°"}
                >
                  <i className="fas fa-street-view" aria-hidden="true" />
                </button>
              </div>
            ) : tourUrl ? (
              <iframe
                title="Visite 360° — La Table Marine"
                src={tourUrl}
                className="tst-visit360__iframe"
                loading="lazy"
                allowFullScreen
                referrerPolicy="same-origin"
              />
            ) : (
              <div className="tst-visit360__error">
                Impossible de charger la visite 360°.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Visit360Section;
