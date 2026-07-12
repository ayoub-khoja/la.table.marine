"use client";

import { CookieConsentProvider } from "@components/cookies/CookieConsentProvider";
import CookieConsentManager from "@components/cookies/CookieConsentManager";

const CookieConsentRoot = ({ children }) => {
  return (
    <CookieConsentProvider>
      {children}
      <CookieConsentManager />
    </CookieConsentProvider>
  );
};

export default CookieConsentRoot;
