"use client";

import { useState } from 'react';

import Data from "@data/sections/promo-video.json";

import VideoModal from "@components/VideoModal";

const PromoVideoSection = () => {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
        {/* video */}
        <div className="row">

            <div className="col-lg-12">

            <div className="tst-video-cover-wrap">
            {/* about video */}
            <div className="tst-about-cover tst-video-cover tst-mb-60">
                <img src={Data.image.url} alt={Data.image.alt} className="tst-cover animateme" data-when="span" data-from="-1" data-to="2" data-easing="easeinout" data-scale="1.2" />
                <div className="tst-overlay"></div>
                <div className="tst-btn-animation"></div>
                <a className="tst-play-button" data-fancybox onClick={() => setOpen(true)} style={{ "cursor" : "pointer" }} data-width="1000" data-height="600">
                    <i className="fas fa-play"></i>
                </a>
            </div>
            {/* about video end */}
            </div>

            </div>

            <VideoModal
              open={isOpen}
              src={Data.video.url}
              poster={Data.image.url}
              onClose={() => setOpen(false)}
            />
        </div>
        {/* video end */}
    </>
  );
};

export default PromoVideoSection;