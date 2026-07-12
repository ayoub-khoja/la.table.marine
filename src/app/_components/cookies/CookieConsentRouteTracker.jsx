"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useCookieConsent } from "@components/cookies/CookieConsentProvider";
import { trackPageView } from "@library/cookies/analytics";

/**
 * Envoie page_view uniquement lors des navigations client (pas au premier chargement :
 * gtag config le gère déjà avec send_page_view: true).
 */
export function CookieConsentRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canUseAnalytics: analyticsAllowed, isReady } = useCookieConsent();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isReady || !analyticsAllowed) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const search = searchParams?.toString();
    trackPageView({
      pathname: pathname || "/",
      search: search ? `?${search}` : "",
      title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [analyticsAllowed, isReady, pathname, searchParams]);

  return null;
}
