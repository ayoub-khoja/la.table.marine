"use client";

import { useCookieConsent } from "@components/cookies/CookieConsentProvider";

const CookieSettingsButton = ({ className = "", children = "Gérer mes cookies" }) => {
  const { openPreferences } = useCookieConsent();

  return (
    <button
      type="button"
      className={`ltm-cookie-settings-btn ${className}`.trim()}
      onClick={openPreferences}
    >
      {children}
    </button>
  );
};

export default CookieSettingsButton;
