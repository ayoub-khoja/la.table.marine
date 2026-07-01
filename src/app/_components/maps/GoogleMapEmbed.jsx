import {
  getGoogleMapsEmbedUrl,
} from "@library/maps/google";

const GoogleMapEmbed = ({
  className = "",
  title = "Localisation sur Google Maps",
}) => {
  return (
    <iframe
      className={className}
      src={getGoogleMapsEmbedUrl()}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
};

export default GoogleMapEmbed;
