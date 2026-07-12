"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import CookieBanner from "@components/cookies/CookieBanner";
import CookiePreferencesModal from "@components/cookies/CookiePreferencesModal";
import { CookieConsentRouteTracker } from "@components/cookies/CookieConsentRouteTracker";

/**
 * Affiche la bannière et la modale de consentement sur les pages publiques uniquement.
 */
const CookieConsentManager = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <CookieBanner />
      <CookiePreferencesModal />
      <Suspense fallback={null}>
        <CookieConsentRouteTracker />
      </Suspense>
    </>
  );
};

export default CookieConsentManager;
