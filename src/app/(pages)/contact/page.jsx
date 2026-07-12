import React from "react";

import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

import PageBanner from "@components/PageBanner";
import ContactInfoSection from "@components/sections/ContactInfo";
import ContactMapSection from "@components/sections/ContactMap";
import ContactFormSection from "@components/sections/ContactForm";
import SeoPageJsonLd from "@components/seo/SeoPageJsonLd";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("contact");

const Contact = () => {
  return (
    <>
        <SeoPageJsonLd pageKey="contact" />
        <div id="tst-dynamic-banner" className="tst-dynamic-banner">
            <PageBanner
              pageTitle={"Contactez-nous"}
              description={"Une question, une réservation ou un renseignement ?<br>Nous sommes à votre écoute à Plaisir."}
              breadTitle={"Contact"}
              showMap={1}
              mapProvider="google"
            />
        </div>
        <main id="tst-dynamic-content" className="tst-dynamic-content">
            <div className="tst-content-frame">
                <div className="tst-content-box">
                    <div className="container tst-p-60-60">
                        <ScrollHint />

                        <ContactInfoSection />
                        <Divider />
                        <ContactMapSection />
                        <Divider />
                        <ContactFormSection />
                    </div>
                </div>
            </div>
        </main>
    </>
  );
};
export default Contact;
