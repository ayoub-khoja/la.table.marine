"use client";

import { useEffect, useRef } from "react";

import { RESTAURANT_VIDEO } from "@library/seo/video";

/**
 * Lecteur vidéo HTML5 optimisé pour le SEO et les performances.
 * @param {object} props
 * @param {boolean} [props.autoplay=false]
 * @param {boolean} [props.controls=true]
 * @param {boolean} [props.loop=false]
 * @param {boolean} [props.muted=false]
 * @param {"none"|"metadata"|"auto"} [props.preload="metadata"]
 * @param {string} [props.className]
 * @param {string} [props.wrapperClassName]
 */
const RestaurantVideoPlayer = ({
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  preload = "metadata",
  className = "",
  wrapperClassName = "",
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!autoplay || !videoRef.current) return;

    const video = videoRef.current;
    video.muted = true;
    const playPromise = video.play();

    if (playPromise) {
      playPromise.catch(() => {});
    }
  }, [autoplay]);

  return (
    <div className={`tst-restaurant-video__player${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      <video
        ref={videoRef}
        className={className || "tst-restaurant-video__video"}
        width={RESTAURANT_VIDEO.width}
        height={RESTAURANT_VIDEO.height}
        poster={RESTAURANT_VIDEO.posterPath}
        controls={controls}
        playsInline
        muted={muted || autoplay}
        loop={loop}
        preload={preload}
        aria-label={RESTAURANT_VIDEO.name}
      >
        <source src={RESTAURANT_VIDEO.contentPath} type={RESTAURANT_VIDEO.mimeType} />
        {RESTAURANT_VIDEO.fallbackText}
      </video>
    </div>
  );
};

export default RestaurantVideoPlayer;
