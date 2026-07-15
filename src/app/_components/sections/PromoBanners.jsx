"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import Data from "@data/sections/promo-banners.json";

// Bannière livraison masquée temporairement — décommenter dans promo-banners.json pour réactiver :
// {
//   "image": "/img/image-liv-gratuite.png",
//   "alt": "Livraison à domicile gratuite — La Table Marine",
//   "link": "tel:0188937672",
//   "width": 1536,
//   "height": 1024,
//   "centered": true
// },

function useInView(ref, { rootMargin = "120px" } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

const PromoBannersSection = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);

  return (
    <section
      ref={sectionRef}
      className={`tst-promo-banners${inView ? " is-visible" : ""}`}
      aria-label="Découvrir La Table Marine"
    >
      <div className={`tst-promo-banners__grid tst-promo-banners__grid--count-${Data.items.length}`}>
        {Data.items.map((item, index) => {
          const imageSizes =
            Data.items.length === 2
              ? "(max-width: 991px) 100vw, 50vw"
              : "(max-width: 991px) 100vw, 33vw";

          const content = (
            <span className="tst-promo-banners__media">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes={imageSizes}
                quality={92}
                className="tst-promo-banners__image"
                priority={index === 0}
              />
            </span>
          );

          const className = `tst-promo-banners__item tst-promo-banners__item--${index + 1}${
            item.centered ? " tst-promo-banners__item--centered" : ""
          }`;

          let banner = null;

          if (item.link?.startsWith("tel:")) {
            banner = (
              <a
                key={`promo-banner-${index}`}
                href={item.link}
                className={className}
                aria-label={item.alt}
              >
                {content}
              </a>
            );
          } else if (item.blank) {
            banner = (
              <a
                key={`promo-banner-${index}`}
                href={item.link}
                className={className}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.alt}
              >
                {content}
              </a>
            );
          } else {
            banner = (
              <Link
                key={`promo-banner-${index}`}
                href={item.link}
                className={className}
                aria-label={item.alt}
              >
                {content}
              </Link>
            );
          }

          if (item.centered) {
            return (
              <div
                key={`promo-banner-wrap-${index}`}
                className="tst-promo-banners__center-wrap"
              >
                {banner}
              </div>
            );
          }

          return banner;
        })}
      </div>
    </section>
  );
};

export default PromoBannersSection;
