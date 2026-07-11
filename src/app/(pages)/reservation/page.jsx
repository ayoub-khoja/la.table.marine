import React from "react";

import AppData from "@data/app.json";

import Divider from "@layouts/divider/Index";

import ContactInfoSection from "@components/sections/ContactInfo";
import ReservationFormSection from "@components/sections/ReservationForm";

export const metadata = {
    title: {
        default: "Reservation Form",
    },
    description: AppData.settings.siteDescription,
}

const Reservation = () => {
  return (
    <>
        <div id="tst-dynamic-content" className="tst-dynamic-content">
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
        </div>
    </>
  );
};
export default Reservation;
