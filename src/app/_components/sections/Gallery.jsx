"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Swiper, SwiperSlide } from "swiper/react";

import { SliderProps } from "@common/sliderProps";
import Data from "@data/sections/gallery.json";

const GallerySection = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const slides = useMemo(
    () =>
      Data.items.map((item) => ({
        src: item.image,
        alt: item.alt,
        title: item.title,
      })),
    []
  );

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="row align-items-center" id="galerie">
        <div className="col-lg-12">
          <div className="text-center">
            <div className="tst-suptitle tst-suptitle-center tst-mb-15">
              {Data.subtitle}
            </div>
            <h3
              className="tst-mb-30"
              dangerouslySetInnerHTML={{ __html: Data.title }}
            />
            <p
              className="tst-text tst-mb-60"
              dangerouslySetInnerHTML={{ __html: Data.description }}
            />
          </div>
        </div>

        <div className="col-lg-12">
          <Swiper
            {...SliderProps.restaurantGallery}
            className="swiper-container tst-restaurant-gallery tst-cursor-scroll"
          >
            {Data.items.map((item, index) => (
              <SwiperSlide
                className="swiper-slide"
                key={`gallery-slide-${item.image}`}
              >
                <article className="tst-restaurant-gallery__card">
                  <div className="tst-restaurant-gallery__media">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 33vw"
                      className="tst-restaurant-gallery__image"
                    />
                    <button
                      type="button"
                      className="tst-restaurant-gallery__zoom"
                      aria-label={`Agrandir : ${item.title}`}
                      onClick={() => openLightbox(index)}
                    >
                      <i className="fas fa-expand" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="tst-restaurant-gallery__caption">
                    <h4>{item.title}</h4>
                    <p>{item.caption}</p>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="col-lg-12">
          <div className="tst-slider-navigation tst-restaurant-gallery__nav">
            <Link href={Data.button.link} className="tst-btn tst-anima-link">
              {Data.button.label}
            </Link>
            <div className="tst-slider-pagination tst-gallery-pagination" />
            <div className="tst-nav tst-right">
              <div className="tst-label">{Data.sliderNavLabel}</div>
              <div className="tst-slider-btn tst-gallery-prev">
                <i className="fas fa-arrow-left" aria-hidden="true" />
              </div>
              <div className="tst-slider-btn tst-gallery-next">
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        styles={{ container: { backgroundColor: "rgba(26, 47, 51, .92)" } }}
      />
    </>
  );
};

export default GallerySection;
