"use client";

import Data from "@data/sections/subscribe.json";
import AppData from "@data/app.json";

import { trackNewsletterSubscribed } from "@library/cookies/track-analytics-events";

const SubscribeSection = () => {
  const handleSubmit = () => {
    trackNewsletterSubscribed({
      page_path: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
  };

  return (
    <>
        {/* subscribe */}
        <div className="tst-banner-sm">
            <div className="tst-cover-frame">
                <img src={Data.image.url} alt={Data.image.alt} className="tst-cover" />
                <div className="tst-overlay"></div>
            </div>
            <div className="row align-items-center">
                <div className="col-lg-12">
                    <div className="tst-text-frame text-center">
                        <div className="tst-suptitle tst-suptitle-mobile-center tst-suptitle-center tst-text-shadow tst-white-2 tst-mb-15" dangerouslySetInnerHTML={{__html : Data.subtitle}} />
                        <h2 className="tst-white-2 tst-text-shadow tst-mb-30" dangerouslySetInnerHTML={{__html : Data.title}} />
                        <p className="tst-text tst-white-2 tst-text-shadow tst-mb-30" dangerouslySetInnerHTML={{__html : Data.description}} />
                        <form action={AppData.settings.mailchimp.url} method="post" target="_blank" onSubmit={handleSubmit}>
                            <input type="email" placeholder={Data.placeholder} name="EMAIL" required />
                            <button className="tst-btn" type="submit">{Data.button}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        {/* subscribe end */}
    </>
  );
};

export default SubscribeSection;
