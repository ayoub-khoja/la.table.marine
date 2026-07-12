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
