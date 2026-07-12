"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  getLinkLocation,
  isDirectionsHref,
  isMenuHref,
  trackDirectionsClicked,
  trackEmailClicked,
  trackMenuViewed,
  trackPhoneClicked,
} from "@library/cookies/track-analytics-events";

const AnalyticsEventListeners = () => {
  const pathname = usePathname();

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const location = getLinkLocation(anchor);

      if (href.startsWith("tel:")) {
        trackPhoneClicked({ link_location: location, page_path: pathname });
        return;
      }

      if (href.startsWith("mailto:")) {
        trackEmailClicked({ link_location: location, page_path: pathname });
        return;
      }

      if (isDirectionsHref(href)) {
        trackDirectionsClicked({ link_location: location, page_path: pathname });
        return;
      }

      if (isMenuHref(href)) {
        trackMenuViewed({ link_location: location, page_path: pathname, source: "navigation" });
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  return null;
};

export default AnalyticsEventListeners;
