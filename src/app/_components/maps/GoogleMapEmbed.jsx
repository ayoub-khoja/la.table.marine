"use client";

import { useState } from "react";

import AppData from "@data/app.json";
import { getGoogleMapsEmbedUrl } from "@library/maps/google";

function getMapPreviewUrl() {
  const { lat, lng, zoom = 16 } = AppData.settings.googleMaps;
  if (!lat || !lng) {
    return null;
  }

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=1200x800&markers=${lat},${lng},red`;
}

const GoogleMapEmbed = ({
  isActive = false,
  className = "",
  title = "Localisation sur Google Maps",
}) => {
  const [previewFailed, setPreviewFailed] = useState(false);

  if (!isActive) {
    const previewUrl = getMapPreviewUrl();

    return (
      <div className={`tst-map-placeholder ${className}`.trim()} aria-hidden="true">
        <div className="tst-map-placeholder__fallback" />
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPreviewFailed(true)}
          />
        ) : null}
        <div className="tst-map-placeholder__pin" aria-hidden="true">
          <i className="fas fa-map-marker-alt" />
        </div>
        <div className="tst-map-placeholder__overlay" />
      </div>
    );
  }

  return (
    <iframe
      className={className}
      src={getGoogleMapsEmbedUrl()}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
};

export default GoogleMapEmbed;
