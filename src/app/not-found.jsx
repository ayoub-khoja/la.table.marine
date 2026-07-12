import Link from "next/link";

import Header from "@layouts/headers/Index";
import Footer from "@layouts/footers/Index";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("notFound");

const NotFound = () => {
  return (
    <>
      <Header layout={"default"} />

      <main id="tst-dynamic-banner" className="tst-dynamic-banner">
        <div className="tst-banner">
          <div className="tst-cover-frame" style={{ overflow: "hidden" }}>
            <img
              src="/img/banners/banner-sm-1.jpg"
              alt=""
              className="tst-cover tst-parallax"
            />
            <div className="tst-overlay"></div>
          </div>
          <div className="tst-banner-content-frame">
            <div className="container">
              <div className="tst-main-title-frame">
                <div className="tst-main-title text-center">
                  <div className="tst-suptitle tst-suptitle-center tst-suptitle-mobile-center tst-text-shadow tst-white-2 tst-mb-15">
                    404
                  </div>
                  <h1 className="tst-white-2 tst-text-shadow tst-mb-30">
                    Page introuvable
                  </h1>
                  <p className="tst-text tst-text-shadow tst-text-lg tst-white-2 tst-mb-30">
                    La page que vous recherchez n&apos;existe plus, a été déplacée ou
                    l&apos;adresse saisie est incorrecte.
                  </p>
                  <div className="tst-mt-30" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/" className="tst-btn">
                      Accueil
                    </Link>
                    <Link href="/menu" className="tst-btn tst-btn--ghost">
                      Carte menu
                    </Link>
                    <Link href="/reservation" className="tst-btn tst-btn--ghost">
                      Réserver
                    </Link>
                    <Link href="/contact" className="tst-btn tst-btn--ghost">
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer layout={"default"} />
    </>
  );
};
export default NotFound;
