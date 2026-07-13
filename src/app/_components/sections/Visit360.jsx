"use client";

import Data from "@data/sections/visit-360.json";
import Visit360Embed from "@components/sections/Visit360Embed";

const Visit360Section = () => {
  const tourUrl = (Data.tourUrl || "").toString().trim();

  return (
    <section className="tst-visit360" aria-label="Visite 360 degrés">
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
              {tourUrl.startsWith("/visite-360/") ? (
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
          <Visit360Embed className="tst-mb-60" />
        </div>
      </div>
    </section>
  );
};

export default Visit360Section;
