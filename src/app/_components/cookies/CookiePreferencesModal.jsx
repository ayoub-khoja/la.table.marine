"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  COOKIE_CATEGORIES,
  COOKIE_SERVICE_DETAILS,
} from "@library/cookies/consent-config";
import { useCookieConsent } from "@components/cookies/CookieConsentProvider";
import CookieCategoryToggle from "@components/cookies/CookieCategoryToggle";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

const CookiePreferencesModal = () => {
  const {
    isPreferencesOpen,
    closePreferences,
    acceptAll,
    rejectAll,
    savePreferences,
    preferences,
  } = useCookieConsent();

  const [draft, setDraft] = useState({
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    externalMedia: preferences.externalMedia,
  });
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isPreferencesOpen) {
      setDraft({
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        externalMedia: preferences.externalMedia,
      });
    }
  }, [isPreferencesOpen, preferences]);

  useEffect(() => {
    if (!isPreferencesOpen || !mounted) return;

    previousFocusRef.current = document.activeElement;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusableElements(dialog);
    focusable[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreferences();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const elements = getFocusableElements(dialogRef.current);
      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);

      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [closePreferences, isPreferencesOpen, mounted]);

  if (!mounted || !isPreferencesOpen) return null;

  const handleSave = () => {
    savePreferences(draft);
  };

  const handleToggle = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return createPortal(
    <div className="ltm-cookie-modal" role="presentation">
      <button
        type="button"
        className="ltm-cookie-modal__backdrop"
        aria-label="Fermer les paramètres des cookies"
        onClick={closePreferences}
      />

      <div
        ref={dialogRef}
        className="ltm-cookie-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ltm-cookie-modal-title"
        aria-describedby="ltm-cookie-modal-desc"
      >
        <header className="ltm-cookie-modal__header">
          <h2 id="ltm-cookie-modal-title" className="ltm-cookie-modal__title">
            Paramètres des cookies
          </h2>
          <button
            type="button"
            className="ltm-cookie-modal__close"
            onClick={closePreferences}
            aria-label="Fermer"
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </header>

        <div className="ltm-cookie-modal__body">
          <p id="ltm-cookie-modal-desc" className="ltm-cookie-modal__intro">
            Choisissez les catégories de cookies que vous autorisez. Les cookies strictement
            nécessaires ne peuvent pas être désactivés car ils assurent le bon fonctionnement du
            site.
          </p>

          <div className="ltm-cookie-modal__categories">
            {COOKIE_CATEGORIES.map((category) => (
              <CookieCategoryToggle
                key={category.id}
                id={category.id}
                label={category.name}
                description={category.description}
                checked={
                  category.id === "necessary"
                    ? true
                    : Boolean(draft[category.id])
                }
                disabled={category.required}
                onChange={(value) => {
                  if (category.id !== "necessary") {
                    handleToggle(category.id, value);
                  }
                }}
              />
            ))}
          </div>

          <details className="ltm-cookie-modal__details">
            <summary>Détails des cookies</summary>
            <div className="ltm-cookie-modal__table-wrap">
              <table className="ltm-cookie-modal__table">
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Finalité</th>
                    <th scope="col">Fournisseur</th>
                    <th scope="col">Durée</th>
                    <th scope="col">Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIE_SERVICE_DETAILS.map((service) => (
                    <tr key={`${service.name}-${service.categoryId}`}>
                      <td>{service.name}</td>
                      <td>{service.purpose}</td>
                      <td>{service.provider}</td>
                      <td>{service.duration}</td>
                      <td>
                        {
                          COOKIE_CATEGORIES.find((c) => c.id === service.categoryId)
                            ?.name
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <footer className="ltm-cookie-modal__footer">
          <button
            type="button"
            className="ltm-cookie-btn ltm-cookie-btn--primary"
            onClick={handleSave}
          >
            Enregistrer mes choix
          </button>
          <button
            type="button"
            className="ltm-cookie-btn ltm-cookie-btn--secondary"
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
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default CookiePreferencesModal;
