"use client";

import { useEffect } from "react";

import { trackMenuViewed } from "@library/cookies/track-analytics-events";

/**
 * @param {{ redirectUrl: string }} props
 */
const MenuPageClient = ({ redirectUrl }) => {
  useEffect(() => {
    trackMenuViewed({ source: "menu_page" });
    window.location.replace(redirectUrl);
  }, [redirectUrl]);

  return (
    <div className="container tst-p-60-60 text-center">
      <h1 className="sr-only">Carte et menu — La Table Marine</h1>
      <p className="tst-text">Chargement de la carte menu…</p>
    </div>
  );
};

export default MenuPageClient;
