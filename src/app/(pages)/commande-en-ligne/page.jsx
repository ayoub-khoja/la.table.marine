import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";
import PageBanner from "@components/PageBanner";
import OnlineOrderContent from "@components/online-order/OnlineOrderContent";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("commandeEnLigne");

export default function CommandeEnLignePage() {
  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner
          pageTitle="Commande en ligne"
          description="Composez votre commande de poissons, fruits de mer et plats maison.<br>Livraison à Plaisir et alentours."
          breadTitle="Commande en ligne"
        />
      </div>
      <div id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <ScrollHint />
              <OnlineOrderContent />
              <Divider onlyBottom={0} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
