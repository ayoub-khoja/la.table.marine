"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import Data from "@data/sections/promo-banners.json";

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
      <div className="tst-promo-banners__grid">
        {Data.items.map((item, index) => {
          const content = (
            <span className="tst-promo-banners__media">
              <Image
                src={item.image}
                alt={item.alt}
                width={item.width || 1536}
                height={item.height || 1024}
                sizes="(max-width: 991px) 100vw, 33vw"
                className="tst-promo-banners__image"
                priority={index === 0}
              />
            </span>
          );

          const className = `tst-promo-banners__item tst-promo-banners__item--${index + 1}`;

          if (item.link?.startsWith("tel:")) {
            return (
              <a
                key={`promo-banner-${index}`}
                href={item.link}
                className={className}
                aria-label={item.alt}
              >
                {content}
              </a>
            );
          }

          if (item.blank) {
            return (
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
          }

          return (
            <Link
              key={`promo-banner-${index}`}
              href={item.link}
              className={className}
              aria-label={item.alt}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default PromoBannersSection;
