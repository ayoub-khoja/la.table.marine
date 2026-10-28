import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAcceptAllConsent,
  createConsentObject,
  createRejectAllConsent,
  clearStoredConsent,
  saveConsent,
} from "./consent-storage";
import {
  META_PIXEL_ID,
  META_PIXEL_SCRIPT_SRC,
  disableMetaPixel,
  getReservationLeadEventId,
  isMetaPixelLoaded,
  loadMetaPixel,
  resetMetaPixelStateForTests,
  trackMetaLead,
  trackMetaPageView,
} from "./meta-pixel";

const EVENT_ID = "3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b";

function pixelScripts() {
  return document.querySelectorAll(`script[src="${META_PIXEL_SCRIPT_SRC}"]`);
}

function trackCalls(eventName) {
  return window.fbq.queue
    .map((args) => Array.from(args))
    .filter((args) => args[0] === "track" && args[1] === eventName);
}

describe("meta-pixel", () => {
  beforeEach(() => {
    clearStoredConsent();
    resetMetaPixelStateForTests();
    delete window.fbq;
    delete window._fbq;
    window.sessionStorage.clear();
    pixelScripts().forEach((script) => script.remove());
  });

  afterEach(() => {
    clearStoredConsent();
    resetMetaPixelStateForTests();
    delete window.fbq;
    delete window._fbq;
  });

  describe("consentement", () => {
    it("ne charge rien sans choix de consentement", () => {
      expect(loadMetaPixel()).toBe(false);
      expect(pixelScripts()).toHaveLength(0);
      expect(window.fbq).toBeUndefined();
    });

    it("ne charge rien si tout est refusé", () => {
      saveConsent(createRejectAllConsent());
      expect(loadMetaPixel()).toBe(false);
      expect(pixelScripts()).toHaveLength(0);
      expect(window.fbq).toBeUndefined();
    });

    it("ne considère pas le consentement analytics comme suffisant", () => {
      saveConsent(createConsentObject({ analytics: true, marketing: false, externalMedia: true }));
      expect(loadMetaPixel()).toBe(false);
      expect(window.fbq).toBeUndefined();
    });

    it("charge le Pixel une seule fois avec le consentement marketing", () => {
      saveConsent(createConsentObject({ analytics: false, marketing: true, externalMedia: false }));

      expect(loadMetaPixel()).toBe(true);
      expect(loadMetaPixel()).toBe(true);

      expect(pixelScripts()).toHaveLength(1);
      expect(window.fbq.disablePushState).not.toBe(true);

      const calls = window.fbq.queue.map((args) => Array.from(args));
      expect(calls.filter((c) => c[0] === "init")).toEqual([["init", META_PIXEL_ID]]);
      expect(calls).toContainEqual(["set", "autoConfig", false, META_PIXEL_ID]);
    });
  });

  describe("PageView", () => {
    it("n'envoie rien si le Pixel n'est pas chargé", () => {
      saveConsent(createAcceptAllConsent());
      expect(trackMetaPageView("/")).toBe(false);
    });

    it("déduplique la même URL (Strict Mode, re-rendus)", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();

      expect(trackMetaPageView("/")).toBe(true);
      expect(trackMetaPageView("/")).toBe(false);
      expect(trackMetaPageView("/menu")).toBe(true);
      expect(trackMetaPageView("/")).toBe(true);

      expect(trackCalls("PageView")).toHaveLength(3);
    });

    it("s'arrête après retrait du consentement", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();
      trackMetaPageView("/");

      saveConsent(createRejectAllConsent());
      expect(trackMetaPageView("/menu")).toBe(false);
      expect(trackCalls("PageView")).toHaveLength(1);
    });
  });

  describe("getReservationLeadEventId", () => {
    it("accepte uniquement une réservation confirmée comme enregistrée", () => {
      expect(
        getReservationLeadEventId(true, {
          success: true,
          reservationSaved: true,
          trackingEventId: EVENT_ID,
        })
      ).toBe(EVENT_ID);
    });

    it.each([
      ["erreur HTTP", false, { success: true, reservationSaved: true, trackingEventId: EVENT_ID }],
      ["erreur de validation", false, { success: false, error: "Champ requis" }],
      ["erreur serveur / base", false, { success: false, error: "Erreur serveur." }],
      ["honeypot (non enregistré)", true, { success: true, emailSent: false }],
      ["success sans reservationSaved", true, { success: true, trackingEventId: EVENT_ID }],
      ["identifiant invalide", true, { success: true, reservationSaved: true, trackingEventId: "a@b.fr" }],
      ["corps vide", true, {}],
      ["corps null", true, null],
    ])("refuse : %s", (_label, ok, data) => {
      expect(getReservationLeadEventId(ok, data)).toBeNull();
    });
  });

  describe("Lead", () => {
    it("n'envoie pas de Lead sans consentement marketing", () => {
      saveConsent(createConsentObject({ analytics: true, marketing: false, externalMedia: false }));
      expect(trackMetaLead({ eventId: EVENT_ID, requestType: "reservation" })).toBe(false);
      expect(window.fbq).toBeUndefined();
    });

    it("envoie un seul Lead par réservation, sans donnée personnelle", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();

      expect(trackMetaLead({ eventId: EVENT_ID, requestType: "reservation" })).toBe(true);
      expect(trackMetaLead({ eventId: EVENT_ID, requestType: "reservation" })).toBe(false);

      const leads = trackCalls("Lead");
      expect(leads).toEqual([
        [
          "track",
          "Lead",
          { content_name: "reservation_request", content_category: "reservation" },
          { eventID: EVENT_ID },
        ],
      ]);
    });

    it("déduplique aussi après rechargement de la page (sessionStorage)", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();
      trackMetaLead({ eventId: EVENT_ID });

      resetMetaPixelStateForTests();
      delete window.fbq;
      loadMetaPixel();

      expect(trackMetaLead({ eventId: EVENT_ID })).toBe(false);
      expect(trackCalls("Lead")).toHaveLength(0);
    });

    it("refuse un identifiant non conforme et ignore un type de demande inconnu", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();

      expect(trackMetaLead({ eventId: "jean.dupont@example.com" })).toBe(false);
      expect(trackMetaLead({ eventId: EVENT_ID, requestType: "0612345678" })).toBe(true);
      expect(trackCalls("Lead")[0][2]).toEqual({ content_name: "reservation_request" });
    });

    it("ne lève jamais d'erreur si fbq plante (script bloqué)", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();
      window.fbq = vi.fn(() => {
        throw new Error("blocked");
      });

      expect(() => trackMetaLead({ eventId: EVENT_ID })).not.toThrow();
      expect(trackMetaLead({ eventId: EVENT_ID })).toBe(false);
    });
  });

  describe("disableMetaPixel", () => {
    it("révoque, retire le script et demande un rechargement si le Pixel était actif", () => {
      saveConsent(createAcceptAllConsent());
      loadMetaPixel();

      saveConsent(createRejectAllConsent());
      const { reloadRequired } = disableMetaPixel();

      expect(reloadRequired).toBe(true);
      expect(isMetaPixelLoaded()).toBe(false);
      expect(pixelScripts()).toHaveLength(0);
      const calls = window.fbq.queue.map((args) => Array.from(args));
      expect(calls).toContainEqual(["consent", "revoke"]);
    });

    it("ne demande pas de rechargement si le Pixel n'a jamais été chargé", () => {
      saveConsent(createRejectAllConsent());
      expect(disableMetaPixel().reloadRequired).toBe(false);
      expect(window.fbq).toBeUndefined();
    });
  });
});
