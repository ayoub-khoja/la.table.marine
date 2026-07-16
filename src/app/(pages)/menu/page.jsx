import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@layouts/headers/Index";
import Footer from "@layouts/footers/Index";
import { getActiveCarteMenu } from "@library/menu/store";
import { getPageMetadata } from "@library/seo/page-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = getPageMetadata("menu");

export default async function MenuPage() {
  let menu = null;

  try {
    menu = await getActiveCarteMenu();
  } catch (error) {
    console.error("[pages/menu]", error);
  }

  if (menu) {
    redirect("/api/menu/file");
  }

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
                    Carte
                  </div>
                  <h1 className="tst-white-2 tst-text-shadow tst-mb-30">
                    Menu temporairement indisponible
                  </h1>
                  <p className="tst-text tst-text-shadow tst-text-lg tst-white-2 tst-mb-30">
                    Notre carte n&apos;est pas disponible pour le moment.
                    Merci de réessayer un peu plus tard ou de nous contacter
                    pour toute information.
                  </p>
                  <div
                    className="tst-mt-30"
                    style={{
                      display: "flex",
                      gap: 12,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Link href="/" className="tst-btn">
                      Accueil
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
}
