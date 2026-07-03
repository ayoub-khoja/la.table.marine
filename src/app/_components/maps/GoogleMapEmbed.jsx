"use client";

import AppData from "@data/app.json";
import { getGoogleMapsEmbedUrl } from "@library/maps/google";

function getMapPreviewUrl() {
  const { lat, lng, zoom = 16 } = AppData.settings.googleMaps;
  if (!lat || !lng) {
    return null;
  }

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=800x500&markers=${lat},${lng},red`;
}

const GoogleMapEmbed = ({
  isActive = false,
  className = "",
  title = "Localisation sur Google Maps",
}) => {
  if (!isActive) {
    const previewUrl = getMapPreviewUrl();

    return (
      <div className={`tst-map-placeholder ${className}`.trim()} aria-hidden="true">
        {previewUrl ? (
          <img src={previewUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="tst-map-placeholder__fallback" />
        )}
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
