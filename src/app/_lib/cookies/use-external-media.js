import { useCookieConsent } from "@components/cookies/CookieConsentProvider";

/**
 * Gère l'activation des contenus externes (ex. Google Maps) selon le consentement.
 */
export function useExternalMediaActivation() {
  const { canUseExternalMedia, openPreferences } = useCookieConsent();

  /**
   * @returns {boolean} true si le contenu a pu être activé
   */
  const requestActivation = () => {
    if (!canUseExternalMedia) {
      openPreferences();
      return false;
    }

    return true;
  };

  return {
    canUseExternalMedia,
    requestActivation,
    openPreferences,
  };
}
