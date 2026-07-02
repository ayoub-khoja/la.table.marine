import Image from "next/image";
import Link from "next/link";

import Data from "@data/sections/call-to-action-4.json";

const IMAGE_WIDTH = 1632;
const IMAGE_HEIGHT = 963;

const CallToActionSection = () => {
  return (
    <div className="tst-call-to-action tst-call-to-action--split">
      <div className="container">
        <div className="tst-cta-split">
          <Image
            src={Data.image.url}
            alt={Data.image.alt}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            priority
            quality={95}
            sizes="(max-width: 992px) 100vw, 1140px"
            className="tst-cta-split__image"
          />

          <div className="tst-cta-split__overlay">
            <div className="tst-cta-split__inner">
              <div className="tst-cta-split__label">
                <span className="tst-cta-split__label-line" aria-hidden="true" />
                <span>{Data.subtitle}</span>
              </div>
              <h2
                className="tst-cta-split__title"
                dangerouslySetInnerHTML={{ __html: Data.title }}
              />
              <p
                className="tst-cta-split__text"
                dangerouslySetInnerHTML={{ __html: Data.description }}
              />
              <div className="tst-cta-split__actions">
                <Link
                  href={Data.button1.link}
                  className="tst-btn tst-btn-lg tst-btn-shadow tst-cta-split__btn"
                >
                  {Data.button1.label}
                </Link>
                <Link
                  href={Data.button2.link}
                  className="tst-cta-split__contact tst-anima-link"
                >
                  {Data.button2.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToActionSection;
