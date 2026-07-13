import JsonLd from "@components/seo/JsonLd";
import PageBanner from "@components/PageBanner";
import RestaurantVideoPageContent from "@components/sections/RestaurantVideoPageContent";
import { buildRestaurantVideoPageSchemas } from "@library/seo/json-ld";
import { getPageMetadata } from "@library/seo/page-metadata";

import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

export const metadata = getPageMetadata("restaurantVideo");

export default function RestaurantVideoPage() {
  return (
    <>
      <JsonLd data={buildRestaurantVideoPageSchemas()} />
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner
          pageTitle="Découvrir La Table Marine en vidéo"
          pageSubTitle=""
          description="Explorez l'ambiance de notre restaurant de poissons et fruits de mer situé à Plaisir."
          breadTitle="Vidéo"
          bannerImage="/img/image00015.png"
          bannerImageAlt="Façade du restaurant La Table Marine à Plaisir, le soir"
          bannerLayout="split-photo"
        />
      </div>
      <main id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-0">
              <ScrollHint />
            </div>
            <div className="container tst-p-60-60">
              <RestaurantVideoPageContent />
              <Divider onlyBottom={0} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
