"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const getFrameSize = (videoWidth, videoHeight) => {
  const aspect = videoWidth / videoHeight;
  const verticalPadding = 96;
  const maxH = window.innerHeight - verticalPadding;
  const maxW = window.innerWidth - 48;
  const isPortrait = aspect < 1;

  if (isPortrait) {
    let height = Math.min(maxH, 720);
    let width = height * aspect;

    const maxPortraitWidth = Math.min(maxW, 380);
    if (width > maxPortraitWidth) {
      width = maxPortraitWidth;
      height = width / aspect;
    }

    if (height > maxH) {
      height = maxH;
      width = height * aspect;
    }

    return { width: Math.round(width), height: Math.round(height), isPortrait };
  }

  let width = Math.min(960, maxW);
  let height = width / aspect;

  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }

  return { width: Math.round(width), height: Math.round(height), isPortrait };
};

const VideoModal = ({ open, onClose, src, poster }) => {
  const videoRef = useRef(null);
  const [frameSize, setFrameSize] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setFrameSize(null);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }

      return;
    }

    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [open]);

  const handleLoadedMetadata = useCallback((e) => {
    const { videoWidth, videoHeight } = e.currentTarget;

    if (!videoWidth || !videoHeight) return;

    setFrameSize(getFrameSize(videoWidth, videoHeight));
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="tst-video-modal" role="dialog" aria-modal="true" aria-label="Lecture vidéo">
      <button
        type="button"
        className="tst-video-modal__backdrop"
        onClick={onClose}
        aria-label="Fermer la vidéo"
      />

      <button
        type="button"
        className="tst-video-modal__close"
        onClick={onClose}
        aria-label="Fermer"
      >
        <i className="fas fa-times" aria-hidden="true" />
      </button>

      <div className="tst-video-modal__wrapper">
        <div
          className={`tst-video-modal__frame${frameSize?.isPortrait ? " tst-video-modal__frame--portrait" : ""}`}
          style={
            frameSize
              ? { width: `${frameSize.width}px`, height: `${frameSize.height}px` }
              : undefined
          }
        >
          {poster ? (
            <div
              className="tst-video-modal__bg"
              style={{ backgroundImage: `url(${poster})` }}
              aria-hidden="true"
            />
          ) : null}

          <video
            ref={videoRef}
            className="tst-video-modal__player"
            controls
            playsInline
            preload="metadata"
            poster={poster}
            onLoadedMetadata={handleLoadedMetadata}
          >
            <source src={src} type="video/mp4" />
            Votre navigateur ne prend pas en charge la lecture vidéo.
          </video>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VideoModal;
