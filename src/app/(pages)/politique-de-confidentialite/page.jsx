import Link from "next/link";

import AppData from "@data/app.json";
import ScrollHint from "@layouts/scroll-hint/Index";
import PageBanner from "@components/PageBanner";
import CookieSettingsButton from "@components/cookies/CookieSettingsButton";
import { COOKIE_POLICY_PATH } from "@library/cookies/consent-config";

export const metadata = {
  title: {
    default: "Politique de confidentialité",
  },
  description:
    "Politique de confidentialité et protection des données personnelles — La Table Marine.",
};

const LAST_UPDATED = "12 juillet 2026";

const PrivacyPolicyPage = () => {
  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner
          pageTitle="Politique de confidentialité"
          description="Comment nous traitons et protégeons vos données personnelles."
          breadTitle="Politique de confidentialité"
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
                  <strong>Dernière mise à jour :</strong> {LAST_UPDATED}
                </p>

                <p>
                  {AppData.settings.siteName} s&apos;engage à protéger la vie privée des visiteurs
                  de son site <strong>latablemarine.com</strong>, conformément au Règlement général
                  sur la protection des données (RGPD).
                </p>

                <h2>Responsable du traitement</h2>
                <div className="ltm-cookie-legal-todo">
                  <strong>TODO juridique :</strong> indiquer le nom de l&apos;entité juridique, son
                  adresse postale, son numéro SIRET et les coordonnées du responsable de traitement.
                </div>

                <h2>Données collectées</h2>
                <p>Selon les formulaires que vous utilisez, nous pouvons traiter :</p>
                <ul>
                  <li>Identité et coordonnées (nom, e-mail, téléphone) via les formulaires de contact ou de réservation ;</li>
                  <li>Données de navigation agrégées, uniquement si vous acceptez les cookies de mesure d&apos;audience ;</li>
                  <li>Préférences de consentement aux cookies (cookie <code>ltm_cookie_consent</code>).</li>
                </ul>

                <h2>Finalités</h2>
                <ul>
                  <li>Répondre à vos demandes et gérer les réservations ;</li>
                  <li>Assurer le fonctionnement et la sécurité du site ;</li>
                  <li>Mesurer l&apos;audience du site, avec votre consentement ;</li>
                  <li>Respecter nos obligations légales.</li>
                </ul>

                <h2>Base légale</h2>
                <p>
                  Exécution de mesures précontractuelles, intérêt légitime, obligation légale et,
                  le cas échéant, consentement pour les cookies non essentiels et certaines
                  communications.
                </p>

                <h2>Durée de conservation</h2>
                <p>
                  Les données sont conservées pendant la durée nécessaire aux finalités poursuivies,
                  puis archivées ou supprimées conformément aux obligations légales applicables.
                </p>

                <h2>Vos droits</h2>
                <p>
                  Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de
                  limitation, d&apos;opposition et de portabilité. Pour les exercer :
                </p>
                <p>
                  <a href="mailto:contact@latablemarine.com">contact@latablemarine.com</a>
                </p>

                <h2>Cookies</h2>
                <p>
                  Pour en savoir plus sur les cookies et gérer vos préférences, consultez notre{" "}
                  <Link href={COOKIE_POLICY_PATH}>politique de cookies</Link> ou utilisez le bouton
                  ci-dessous :
                </p>
                <p>
                  <CookieSettingsButton className="ltm-cookie-btn ltm-cookie-btn--ghost" />
                </p>

                <h2>Hébergement</h2>
                <div className="ltm-cookie-legal-todo">
                  <strong>TODO juridique :</strong> préciser l&apos;identité et l&apos;adresse de
                  l&apos;hébergeur du site.
                </div>

                <h2>Réclamation</h2>
                <p>
                  Vous pouvez introduire une réclamation auprès de la CNIL (
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.cnil.fr
                  </a>
                  ).
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
