import Link from "next/link";

import AppData from "@data/app.json";
import ScrollHint from "@layouts/scroll-hint/Index";
import PageBanner from "@components/PageBanner";
import CookieSettingsButton from "@components/cookies/CookieSettingsButton";
import {
  COOKIE_CATEGORIES,
  COOKIE_SERVICE_DETAILS,
  CONSENT_VERSION,
  PRIVACY_POLICY_PATH,
} from "@library/cookies/consent-config";
import { getPageMetadata } from "@library/seo/page-metadata";

export const metadata = getPageMetadata("cookies");

const LAST_UPDATED = "12 juillet 2026";

const CookiePolicyPage = () => {
  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner
          pageTitle="Politique de cookies"
          description="Transparence sur les cookies utilisés sur notre site."
          breadTitle="Politique de cookies"
          bannerImage="/img/image00015.png"
          bannerImageAlt="Façade du restaurant La Table Marine à Plaisir, le soir"
          bannerLayout="split-photo"
        />
      </div>

      <div id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <ScrollHint />

              <article className="ltm-cookie-legal-page">
                <p className="ltm-cookie-legal-notice" role="note">
                  Ce contenu constitue une base technique et doit être validé juridiquement par le
                  responsable du site.
                </p>

                <p>
                  <strong>Dernière mise à jour :</strong> {LAST_UPDATED} — Version {CONSENT_VERSION}
                </p>

                <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
                <p>
                  Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur,
                  tablette, smartphone) lors de la consultation d&apos;un site. Il permet au site de
                  mémoriser des informations pendant une durée limitée.
                </p>

                <h2>Catégories de cookies utilisées</h2>
                <ul>
                  {COOKIE_CATEGORIES.map((category) => (
                    <li key={category.id}>
                      <strong>{category.name}</strong> — {category.description}
                    </li>
                  ))}
                </ul>

                <h2>Finalités et base légale</h2>
                <p>
                  Les cookies strictement nécessaires sont utilisés sur la base de notre intérêt
                  légitime à assurer le fonctionnement et la sécurité du site. Les cookies de mesure
                  d&apos;audience, marketing et contenus externes ne sont déposés qu&apos;avec votre
                  consentement explicite, conformément au RGPD et aux recommandations de la CNIL.
                </p>

                <h2>Durée de conservation de votre choix</h2>
                <p>
                  Votre choix de consentement est conservé pendant 6 mois dans un cookie first-party
                  nommé <code>ltm_cookie_consent</code>. Passé ce délai, ou en cas de modification de
                  notre politique, la bannière de consentement vous sera à nouveau proposée.
                </p>

                <h2>Google Analytics 4</h2>
                <p>
                  Lorsque vous acceptez les cookies de mesure d&apos;audience, nous pouvons charger
                  Google Analytics 4 (Google Ireland Limited) afin de mesurer l&apos;audience du site
                  de manière agrégée. Aucune donnée personnelle identifiable (nom, e-mail, téléphone,
                  message, données de réservation) n&apos;est transmise volontairement via notre
                  intégration.
                </p>
                <p>
                  Cookies susceptibles d&apos;être déposés : <code>_ga</code>, <code>_ga_*</code>.
                  Durée indicative : jusqu&apos;à 2 ans selon Google.
                </p>

                <h2>Contenus externes</h2>
                <p>
                  Google Maps peut être affiché après votre consentement à la catégorie « Contenus
                  externes ». Sans ce consentement, une carte statique ou un aperçu est affiché et
                  l&apos;iframe Google Maps n&apos;est pas chargée.
                </p>

                <h2>Modifier ou retirer votre consentement</h2>
                <p>
                  Vous pouvez modifier vos préférences à tout moment via le lien « Gérer mes cookies »
                  en pied de page, ou directement ci-dessous :
                </p>
                <p>
                  <CookieSettingsButton className="ltm-cookie-btn ltm-cookie-btn--ghost" />
                </p>

                <h2>Détails des cookies et services</h2>
                <div className="ltm-cookie-modal__table-wrap">
                  <table className="ltm-cookie-modal__table">
                    <thead>
                      <tr>
                        <th scope="col">Service</th>
                        <th scope="col">Finalité</th>
                        <th scope="col">Fournisseur</th>
                        <th scope="col">Durée</th>
                        <th scope="col">Catégorie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COOKIE_SERVICE_DETAILS.map((service) => (
                        <tr key={`${service.name}-${service.categoryId}`}>
                          <td>{service.name}</td>
                          <td>{service.purpose}</td>
                          <td>{service.provider}</td>
                          <td>{service.duration}</td>
                          <td>
                            {
                              COOKIE_CATEGORIES.find((c) => c.id === service.categoryId)
                                ?.name
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h2>Contact</h2>
                <p>
                  Pour toute question relative aux cookies :{" "}
                  <a href="mailto:contact@latablemarine.com">contact@latablemarine.com</a>
                </p>

                <p>
                  Consultez également notre{" "}
                  <Link href={PRIVACY_POLICY_PATH}>politique de confidentialité</Link>.
                </p>

                <div className="ltm-cookie-legal-todo">
                  <strong>TODO juridique :</strong> compléter l&apos;identité du responsable de
                  traitement, l&apos;hébergeur, le délégué à la protection des données (le cas
                  échéant) et les mentions légales obligatoires après validation par un conseil
                  juridique.
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiePolicyPage;
