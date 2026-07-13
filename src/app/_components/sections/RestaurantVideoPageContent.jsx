import Link from "next/link";

import RestaurantVideoPlayer from "@components/seo/RestaurantVideoPlayer";
import Visit360Embed from "@components/sections/Visit360Embed";
import AppData from "@data/app.json";
import PageData from "@data/sections/restaurant-video-page.json";
import { RESTAURANT_VIDEO } from "@library/seo/video";

const RestaurantVideoPageContent = () => {
  return (
    <article className="tst-video-page">
      <header className="tst-video-page__intro text-center">
        <div className="tst-suptitle tst-suptitle-center tst-mb-15">{PageData.intro.subtitle}</div>
        <p className="tst-video-page__lead tst-text">{PageData.intro.lead}</p>
      </header>

      <section className="tst-video-page__showcase" aria-labelledby="video-showcase-title">
        <h2 id="video-showcase-title" className="visually-hidden">
          Vidéo de présentation
        </h2>

        <div className="tst-video-page__showcase-grid">
          <div className="tst-video-page__player-col">
            <div className="tst-video-page__player-shell">
              <div className="tst-video-page__player-badge">
                <i className="fas fa-play" aria-hidden="true" />
                <span>Vidéo officielle</span>
              </div>
              <RestaurantVideoPlayer
                controls
                preload="metadata"
                className="tst-video-page__video"
                wrapperClassName="tst-video-page__player"
              />
              <p className="tst-video-page__caption">{RESTAURANT_VIDEO.name}</p>
            </div>
          </div>

          <div className="tst-video-page__details-col">
            <div className="tst-video-page__details-card">
              <div className="tst-video-page__details-label">
                <span className="tst-video-page__details-line" aria-hidden="true" />
                <span>À propos de cette vidéo</span>
              </div>

              <h3 className="tst-video-page__details-title">
                L&apos;ambiance de La Table Marine
              </h3>

              <p className="tst-text tst-video-page__details-text">
                {RESTAURANT_VIDEO.description} Entre salle lumineuse, dressage soigné et
                esprit maison, cette vidéo reflète l&apos;expérience que nous réservons à nos
                convives au 2 rue Pierre Curie.
              </p>

              <ul className="tst-video-page__meta-list">
                {PageData.details.map((item) => (
                  <li key={item.label} className="tst-video-page__meta-item">
                    <span className="tst-video-page__meta-icon" aria-hidden="true">
                      <i className={item.icon} />
                    </span>
                    <span className="tst-video-page__meta-copy">
                      <span className="tst-video-page__meta-label">{item.label}</span>
                      <span className="tst-video-page__meta-value">{item.value}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="tst-video-page__contact-strip">
                <a href="tel:0188937672" className="tst-video-page__contact-chip">
                  <i className="fas fa-phone" aria-hidden="true" />
                  01 88 93 76 72
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(AppData.settings.googleMaps.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tst-video-page__contact-chip"
                >
                  <i className="fas fa-directions" aria-hidden="true" />
                  Itinéraire
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tst-video-page__highlights" aria-labelledby="video-highlights-title">
        <div className="text-center tst-mb-60">
          <div className="tst-suptitle tst-suptitle-center tst-mb-15">Ce que vous découvrirez</div>
          <h2 id="video-highlights-title" className="tst-mb-30">
            Une expérience autour de la mer
          </h2>
        </div>

        <div className="row">
          {PageData.highlights.map((item, index) => (
            <div className="col-lg-4" key={item.title}>
              <div className="tst-video-page__highlight-card tst-mb-60">
                <div className="tst-video-page__highlight-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <img src={item.icon} alt="" className="tst-video-page__highlight-icon" />
                <h3 className="tst-video-page__highlight-title">{item.title}</h3>
                <p className="tst-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tst-video-page__cta" aria-labelledby="video-cta-title">
        <div className="tst-video-page__cta-card">
          <div className="tst-video-page__cta-media">
            <Visit360Embed fill lazyRootMargin="300px" />
          </div>

          <div className="tst-video-page__cta-content">
            <div className="tst-video-page__cta-label">
              <span className="tst-video-page__details-line" aria-hidden="true" />
              <span>{PageData.cta.subtitle}</span>
            </div>
            <h2 id="video-cta-title" className="tst-video-page__cta-title">
              {PageData.cta.title}
            </h2>
            <p className="tst-video-page__cta-text">{PageData.cta.description}</p>
            <div className="tst-video-page__cta-actions">
              <Link
                href={PageData.cta.buttonMenu.link}
                className="tst-btn tst-btn-lg tst-btn-shadow"
              >
                {PageData.cta.buttonMenu.label}
              </Link>
              <Link
                href={PageData.cta.buttonReservation.link}
                className="tst-btn tst-btn-lg tst-btn-shadow tst-video-page__cta-btn-alt"
              >
                {PageData.cta.buttonReservation.label}
              </Link>
              <Link href={PageData.cta.buttonAbout.link} className="tst-video-page__cta-link tst-anima-link">
                {PageData.cta.buttonAbout.label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default RestaurantVideoPageContent;
