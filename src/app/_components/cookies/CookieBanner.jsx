"use client";

import Link from "next/link";

import { COOKIE_POLICY_PATH } from "@library/cookies/consent-config";
import { useCookieConsent } from "@components/cookies/CookieConsentProvider";

const CookieBanner = () => {
  const { isBannerVisible, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (!isBannerVisible) return null;

  return (
    <div
      className="ltm-cookie-banner"
      role="region"
      aria-labelledby="ltm-cookie-banner-title"
      aria-describedby="ltm-cookie-banner-desc"
    >
      <div className="ltm-cookie-banner__inner container">
        <div className="ltm-cookie-banner__content">
          <div className="ltm-cookie-banner__heading">
            <span className="ltm-cookie-banner__icon" aria-hidden="true">
              <i className="fas fa-cookie-bite" />
            </span>
            <h2 id="ltm-cookie-banner-title" className="ltm-cookie-banner__title">
              Nous respectons votre vie privée
            </h2>
          </div>
          <p id="ltm-cookie-banner-desc" className="ltm-cookie-banner__text">
            Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre accord,
            des cookies de mesure d&apos;audience afin de comprendre l&apos;utilisation de notre site
            et d&apos;améliorer votre expérience. Vous pouvez accepter, refuser ou personnaliser vos
            choix.
          </p>
          <Link href={COOKIE_POLICY_PATH} className="ltm-cookie-banner__link">
            En savoir plus sur notre politique de cookies
          </Link>
        </div>

        <div className="ltm-cookie-banner__actions">
          <button
            type="button"
            className="ltm-cookie-btn ltm-cookie-btn--primary"
            onClick={acceptAll}
          >
            Tout accepter
          </button>
          <button
            type="button"
            className="ltm-cookie-btn ltm-cookie-btn--secondary"
            onClick={rejectAll}
          >
            Tout refuser
          </button>
          <button
            type="button"
            className="ltm-cookie-btn ltm-cookie-btn--ghost"
            onClick={openPreferences}
          >
            Personnaliser
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
