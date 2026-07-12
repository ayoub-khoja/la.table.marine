import React from "react";

import Divider from "@layouts/divider/Index";
import PageBanner from "@components/PageBanner";
import SeoPageJsonLd from "@components/seo/SeoPageJsonLd";
import ContactInfoSection from "@components/sections/ContactInfo";
import ReservationFormSection from "@components/sections/ReservationForm";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("reservation");

const Reservation = () => {
  return (
    <>
      <SeoPageJsonLd pageKey="reservation" />
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner
          pageTitle={"Réserver une table"}
          description={
            "Réservez votre table à La Table Marine, restaurant de poissons et fruits de mer à Plaisir."
          }
          breadTitle={"Réservation"}
          bannerLayout="split-photo"
          bannerImage="/img/image00015.png"
          bannerImageAlt="Restaurant La Table Marine à Plaisir"
        />
      </div>
      <main id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="tst-reservation-page">
              <div className="container tst-p-60-60">
                <div className="tst-reservation-page__card">
                  <ReservationFormSection showTitle={false} />
                </div>
                <Divider onlyBottom={0} />
                <ContactInfoSection />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default Reservation;
