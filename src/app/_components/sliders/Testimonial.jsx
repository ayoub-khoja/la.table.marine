"use client";

import { useCallback, useEffect, useState } from "react";
import { SliderProps } from "@common/sliderProps";
import { Swiper, SwiperSlide } from "swiper/react";

import Data from "@data/sliders/testimonial";
import Link from "next/link";

import ReviewFormPopup from "@components/forms/ReviewFormPopup";

const TestimonialSlider = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewPopupOpen, setReviewPopupOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      } else {
        setReviews(Data.items || []);
      }
    } catch {
      setReviews(Data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const items = reviews.length ? reviews : loading ? [] : Data.items || [];

  return (
    <>
      <div className="row">
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
              className="tst-text"
              dangerouslySetInnerHTML={{ __html: Data.description }}
            />
          </div>
        </div>

        <div className="col-lg-12">
          {loading ? (
            <div className="tst-testimonials-loading" role="status">
              <i className="fas fa-spinner fa-spin" aria-hidden="true" />
              <span>Chargement des avis…</span>
            </div>
          ) : items.length ? (
            <Swiper
              key={`testimonials-${items.length}`}
              {...SliderProps.testimonialsSlider}
              className="swiper-container tst-testimonials-slider tst-cursor-scroll"
            >
              {items.map((item) => (
                <SwiperSlide
                  className="swiper-slide"
                  key={item.id || `${item.name}-${item.title}`}
                >
                  <div className="tst-testimonial-card">
                    <div className="tst-quote">"</div>
                    <h5 className="tst-mb-30">{item.title}</h5>
                    <p className="tst-text">{item.text}</p>
                    <div className="tst-spacer-sm"></div>
                    <div className="tst-testimonial-bottom">
                      <div className="tst-visitor">
                        <h6>{item.name}</h6>
                      </div>
                      <div className="tst-date">{item.date}</div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p className="tst-text text-center">
              Aucun avis publié pour le moment. Soyez le premier à partager votre
              expérience !
            </p>
          )}
        </div>

        <div className="col-lg-12">
          <div className="tst-slider-navigation">
            <div className="tst-slider-navigation__actions">
              <Link
                href={Data.button.link}
                className="tst-btn tst-anima-link"
              >
                {Data.button.label}
              </Link>
              <button
                type="button"
                className="tst-btn tst-btn-outline tst-anima-link"
                onClick={() => setReviewPopupOpen(true)}
              >
                <i className="fas fa-pen" aria-hidden="true" />{" "}
                {Data.addReviewLabel}
              </button>
            </div>
            <div className="tst-slider-pagination tst-testi-pagination"></div>
            <div className="tst-nav tst-right">
              <div className="tst-label">
                {Data.sliderNavLabel || "Navigation du carrousel"}
              </div>
              <div className="tst-slider-btn tst-testi-prev">
                <i className="fas fa-arrow-left" aria-hidden="true" />
              </div>
              <div className="tst-slider-btn tst-testi-next">
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReviewFormPopup
        open={reviewPopupOpen}
        onClose={() => setReviewPopupOpen(false)}
        onSuccess={fetchReviews}
      />
    </>
  );
};

export default TestimonialSlider;
