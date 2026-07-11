"use client";

import { useState } from "react";

import Data from "@data/sections/promo-video.json";

import VideoModal from "@components/VideoModal";

const PromoVideoSection = () => {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <div className="row align-items-center tst-promo-video">
        <div className="col-lg-6">
          <div className="tst-about-cover tst-video-cover tst-mb-60">
            <img
              src={Data.image.url}
              alt={Data.image.alt}
              className="tst-cover animateme"
              data-when="span"
              data-from="-1"
              data-to="2"
              data-easing="easeinout"
              data-scale="1.2"
            />
            <div className="tst-overlay" />
            <div className="tst-btn-animation" />
            <button
              type="button"
              className="tst-play-button"
              onClick={() => setOpen(true)}
              aria-label="Lire la vidéo de présentation"
            >
              <i className="fas fa-play" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="tst-mb-60">
            <div
              className="tst-suptitle tst-mb-15"
              dangerouslySetInnerHTML={{ __html: Data.subtitle }}
            />
            <h3
              className="tst-mb-30"
              dangerouslySetInnerHTML={{ __html: Data.title }}
            />
            <p
              className="tst-text"
              dangerouslySetInnerHTML={{ __html: Data.description }}
            />
          </div>
        </div>
      </div>

      <VideoModal
        open={isOpen}
        src={Data.video.url}
        poster={Data.image.url}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default PromoVideoSection;
