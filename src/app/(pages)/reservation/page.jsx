import React from "react";

import AppData from "@data/app.json";

import ScrollHint from "@layouts/scroll-hint/Index";
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
                        <ScrollHint />

                        <div className="tst-reservation-page__hero tst-mb-60">
                          <div className="tst-reservation-page__hero-inner">
                            <div className="tst-suptitle tst-suptitle-center tst-mb-15">
                              Table reservation
                            </div>
                            <h1 className="tst-mb-30">Réservation</h1>
                            <p className="tst-text tst-mb-30">
                              Sélectionnez l’occasion, le créneau et laissez vos coordonnées.
                            </p>
                            <div className="tst-reservation-page__chips">
                              <span className="tst-reservation-wizard__chip">
                                <i className="fas fa-calendar-alt" aria-hidden="true" />
                                Date
                              </span>
                              <span className="tst-reservation-wizard__chip">
                                <i className="fas fa-clock" aria-hidden="true" />
                                Horaire
                              </span>
                              <span className="tst-reservation-wizard__chip">
                                <i className="fas fa-user-friends" aria-hidden="true" />
                                Personnes
                              </span>
                              <span className="tst-reservation-wizard__chip">
                                <i className="fas fa-phone" aria-hidden="true" />
                                Confirmation
                              </span>
                            </div>
                          </div>
                        </div>

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
