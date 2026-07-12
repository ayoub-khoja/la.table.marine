import AppData from "@data/app.json";
import Data from "@data/sections/contact-map.json";
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsPlaceUrl,
} from "@library/maps/google";

const ContactMapSection = () => {
  const { googleMaps } = AppData.settings;
  const phoneHref = Data.phone.replace(/\s+/g, "");

  return (
    <section className="tst-contact-map tst-mb-60" aria-labelledby="contact-map-title">
      <div className="tst-contact-map__bar">
        <div className="tst-contact-map__bar-info">
          <div
            className="tst-suptitle tst-mb-15"
            dangerouslySetInnerHTML={{ __html: Data.subtitle }}
          />
          <h3 id="contact-map-title" className="tst-mb-10" dangerouslySetInnerHTML={{ __html: Data.title }} />
          <p className="tst-text tst-mb-0" dangerouslySetInnerHTML={{ __html: Data.description }} />
        </div>

        <aside className="tst-contact-map__bar-card">
          <address className="tst-contact-map__card-header">
            <i className="fas fa-map-marker-alt" aria-hidden="true" />
            <div>
              <h4>{googleMaps.name}</h4>
              <p>{googleMaps.address}</p>
            </div>
          </address>

          <ul className="tst-contact-map__details tst-contact-map__details--inline">
            <li>
              <span className="tst-contact-map__label">Téléphone</span>
              <p>
                <a href={`tel:${phoneHref}`}>{Data.phone}</a>
              </p>
            </li>
            <li>
              <span className="tst-contact-map__label">E-mail</span>
              <p>
                <a href={`mailto:${Data.email}`}>{Data.email}</a>
              </p>
            </li>
          </ul>

          <div className="tst-contact-map__actions tst-contact-map__actions--inline">
            <a
              href={getGoogleMapsDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="tst-btn tst-btn--primary"
            >
              <i className="fas fa-directions" aria-hidden="true" />
              Obtenir l&apos;itinéraire
            </a>
            <a
              href={getGoogleMapsPlaceUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="tst-btn tst-btn--ghost"
            >
              <i className="fab fa-google" aria-hidden="true" />
              Google Maps
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ContactMapSection;
