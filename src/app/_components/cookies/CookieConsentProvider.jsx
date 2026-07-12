"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canUseAnalytics,
  canUseExternalMedia,
  canUseMarketing,
  clearStoredConsent,
  consentToPreferences,
  createAcceptAllConsent,
  createConsentObject,
  createRejectAllConsent,
  isConsentValid,
  loadConsent,
  saveConsent,
} from "@library/cookies/consent-storage";
import { cleanupCookiesForConsent } from "@library/cookies/cleanup-cookies";
import { applyGoogleConsentUpdate } from "@library/cookies/google-consent";
import {
  getGaMeasurementId,
  loadGoogleAnalyticsScript,
  unloadGoogleAnalytics,
} from "@library/cookies/analytics";

/** @type {import('react').Context<ReturnType<typeof createDefaultContextValue> | null>} */
const CookieConsentContext = createContext(null);

function createDefaultContextValue() {
  return {
    consent: null,
    hasValidConsent: false,
    isBannerVisible: false,
    isPreferencesOpen: false,
    isReady: false,
    acceptAll: () => {},
    rejectAll: () => {},
    savePreferences: () => {},
    openPreferences: () => {},
    closePreferences: () => {},
    resetConsent: () => {},
    canUseAnalytics: false,
    canUseMarketing: false,
    canUseExternalMedia: false,
  };
}

/**
 * @param {import('./consent-types').CookieConsent | null} consent
 */
function syncServicesWithConsent(consent) {
  applyGoogleConsentUpdate(consent);
  cleanupCookiesForConsent(
    consent || { analytics: false, marketing: false, externalMedia: false, necessary: true }
  );

  const measurementId = getGaMeasurementId();

  if (consent && canUseAnalytics(consent) && measurementId) {
    loadGoogleAnalyticsScript(measurementId);
  } else {
    unloadGoogleAnalytics();
  }
}

/**
 * @param {import('./consent-types').CookieConsent} nextConsent
 */
function persistConsent(nextConsent) {
  saveConsent(nextConsent);
  syncServicesWithConsent(nextConsent);
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(null);
  const [hasValidConsent, setHasValidConsent] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = loadConsent();
    const valid = isConsentValid(stored);

    setConsent(stored);
    setHasValidConsent(valid);
    setIsBannerVisible(!valid);
    setIsReady(true);

    if (valid && stored) {
      syncServicesWithConsent(stored);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const nextConsent = createAcceptAllConsent();
    persistConsent(nextConsent);
    setConsent(nextConsent);
    setHasValidConsent(true);
    setIsBannerVisible(false);
    setIsPreferencesOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    const nextConsent = createRejectAllConsent();
    persistConsent(nextConsent);
    setConsent(nextConsent);
    setHasValidConsent(true);
    setIsBannerVisible(false);
    setIsPreferencesOpen(false);
  }, []);

  const savePreferences = useCallback(
    /** @param {import('./consent-types').CookiePreferences} preferences */ (preferences) => {
      const nextConsent = createConsentObject(preferences);
      persistConsent(nextConsent);
      setConsent(nextConsent);
      setHasValidConsent(true);
      setIsBannerVisible(false);
      setIsPreferencesOpen(false);
    },
    []
  );

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const resetConsent = useCallback(() => {
    clearStoredConsent();
    unloadGoogleAnalytics();
    applyGoogleConsentUpdate(null);
    cleanupCookiesForConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      externalMedia: false,
    });

    setConsent(null);
    setHasValidConsent(false);
    setIsBannerVisible(true);
    setIsPreferencesOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      hasValidConsent,
      isBannerVisible: isReady && isBannerVisible,
      isPreferencesOpen,
      isReady,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
      resetConsent,
      canUseAnalytics: canUseAnalytics(consent),
      canUseMarketing: canUseMarketing(consent),
      canUseExternalMedia: canUseExternalMedia(consent),
      preferences: consentToPreferences(consent),
    }),
    [
      consent,
      hasValidConsent,
      isBannerVisible,
      isPreferencesOpen,
      isReady,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
      resetConsent,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent doit être utilisé dans CookieConsentProvider");
  }

  return context;
}

