import React from "react";

import Divider from "@layouts/divider/Index";
import SeoPageJsonLd from "@components/seo/SeoPageJsonLd";
import ContactInfoSection from "@components/sections/ContactInfo";
import ReservationFormSection from "@components/sections/ReservationForm";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("reservation");

const Reservation = () => {
  return (
    <>
      <SeoPageJsonLd pageKey="reservation" />
      <main id="tst-dynamic-content" className="tst-dynamic-content" style={{ paddingTop: "110px" }}>
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="tst-reservation-page">
              <div className="container tst-p-60-60">
                <header className="text-center tst-mb-60">
                  <h1 className="tst-mb-30">Réservez votre table à La Table Marine</h1>
                  <p className="tst-text">
                    Réservez votre déjeuner ou votre dîner dans notre restaurant à Plaisir
                    à l&apos;aide du formulaire ci-dessous.
                  </p>
                </header>
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
