import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";
import OnlineOrderContent from "@components/online-order/OnlineOrderContent";
import SeoPageJsonLd from "@components/seo/SeoPageJsonLd";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("commandeEnLigne");

export default function CommandeEnLignePage() {
  return (
    <>
      <SeoPageJsonLd
        pageKey="commandeEnLigne"
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Commande en ligne", path: "/commande-en-ligne" },
        ]}
      />
      <main id="tst-dynamic-content" className="tst-dynamic-content" style={{ paddingTop: "110px" }}>
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <ScrollHint />
              <OnlineOrderContent />
              <Divider onlyBottom={0} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
