"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useCookieConsent } from "@components/cookies/CookieConsentProvider";
import { loadMetaPixel, trackMetaPageView } from "@library/cookies/meta-pixel";

/**
 * Charge le Meta Pixel après consentement marketing.
 * Un seul PageView manuel est envoyé (page courante). Les navigations suivantes
 * sont émises par fbevents.js, qui écoute pushState / replaceState / popstate.
 * Un appel manuel supplémentaire ne part pas sur le réseau.
 */
export function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canUseMarketing: marketingAllowed, isReady } = useCookieConsent();
  const hasTrackedInitial = useRef(false);

  useEffect(() => {
    if (!isReady || !marketingAllowed) {
      hasTrackedInitial.current = false;
      return;
    }
    if (!loadMetaPixel()) return;
    if (hasTrackedInitial.current) return;

    hasTrackedInitial.current = true;
    const search = searchParams?.toString();
    trackMetaPageView(`${pathname || "/"}${search ? `?${search}` : ""}`);
  }, [isReady, marketingAllowed, pathname, searchParams]);

  return null;
}
