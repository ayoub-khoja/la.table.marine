"use client";

import { CookieConsentProvider } from "@components/cookies/CookieConsentProvider";
import CookieConsentManager from "@components/cookies/CookieConsentManager";
import AnalyticsEventListeners from "@components/cookies/AnalyticsEventListeners";

const CookieConsentRoot = ({ children }) => {
  return (
    <CookieConsentProvider>
      {children}
      <AnalyticsEventListeners />
      <CookieConsentManager />
    </CookieConsentProvider>
  );
};

export default CookieConsentRoot;
