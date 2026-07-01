"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

import { ScrollAnimation } from "@common/scrollAnims";
import { mapboxInit } from "@common/mapboxInit";
import GoogleMapEmbed from "@components/maps/GoogleMapEmbed";
import AppData from "@data/app.json";
import { getGoogleMapsDirectionsUrl } from "@library/maps/google";

const PageBanner = ({ pageTitle, pageSubTitle = false, description, breadTitle, showMap = 0, mapProvider = "mapbox" }) => {
  const asPath = usePathname();
  const [mapLock, setMapLock] = useState(false);

  let clearBreadTitle;
  
  if(!pageSubTitle) {
    pageSubTitle = breadTitle;
  }

  if ( breadTitle != undefined ) {
    clearBreadTitle = breadTitle;
  } else {
    const regex = /(<([^>]+)>)/gi;
    clearBreadTitle = pageTitle ? pageTitle.replace(regex, "") : "";
  }

  if ( pageTitle == 'Search: %s' || pageTitle == 'Recherche : %s' || pageTitle == 'Recherche: %s' ) {
    const searchParams = useSearchParams();
    const query = searchParams.get('key');
    
    pageTitle = 'Recherche : '+query;
  }
  
  useEffect(() => {
    ScrollAnimation();

    if (showMap && mapProvider === "mapbox") {
      mapboxInit();
    }
  }, [showMap, mapProvider]);
  
  return (
    <>    
      {/* banner */}
      <div className={`tst-banner tst-small-banner${showMap && mapProvider === "google" ? " tst-banner--split-map" : ""}`}>
        {showMap ? (
        mapProvider === "google" ? (
        <div className="tst-cover-frame tst-cover-frame--split">
          <div className="tst-banner-split__left">
            <div className="tst-banner-split__left-bg" />
            <div className="tst-banner-split__left-overlay" />
          </div>
          <div className="tst-banner-split__right">
            <div className="tst-banner-split__map-shell">
              <div className="tst-banner-split__map-badge">
                <i className="fas fa-map-marker-alt" aria-hidden="true" />
                <span>{AppData.settings.googleMaps.name}</span>
              </div>
              <div className="tst-map-frame">
                <div className={`tst-map tst-map--google tst-map--split ${mapLock ? "tst-active" : ""}`}>
                  <GoogleMapEmbed title="Localisation — La Table Marine" />
                </div>
              </div>
              <div
                className={`tst-lock tst-lock--split ${mapLock ? "tst-active" : ""}`}
                onClick={() => setMapLock(!mapLock)}
                role="button"
                tabIndex={0}
                aria-label={mapLock ? "Déverrouiller la carte" : "Verrouiller la carte"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setMapLock(!mapLock);
                  }
                }}
              >
                <i className={`fas ${mapLock ? "fa-unlock" : "fa-lock"}`} />
                <span>{mapLock ? "Déverrouiller" : "Interagir"}</span>
              </div>
              {mapLock ? (
                <div
                  className="tst-banner-split__map-shield"
                  onClick={() => setMapLock(false)}
                  role="button"
                  tabIndex={0}
                  aria-label="Déverrouiller la carte"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMapLock(false);
                    }
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
        ) : (
        <div className="tst-cover-frame">
          <div className="tst-map-frame tst-parallax">
            <div id="map" className={`tst-map ${mapLock ? "tst-active": ""}`} />
          </div>
          <div className={`tst-overlay tst-with-map ${mapLock ? "tst-active": ""}`}></div>
          <div className={`tst-lock ${mapLock ? "tst-active": ""}`} onClick={() => setMapLock(!mapLock)}>
            <i className={`fas ${mapLock ? "fa-unlock": "fa-lock"}`} />
          </div>
        </div>
        )
        ) : (
        <div className="tst-cover-frame"> 
          <img src="/img/banners/banner-sm-1.jpg" alt="cover" className="tst-cover tst-parallax" />
          <div className="tst-overlay"></div>
        </div>
        )}
        <div className={showMap ? `tst-banner-content-frame tst-with-map ${mapLock ? "tst-active": ""}${mapProvider === "google" ? " tst-banner-content-frame--split" : ""}` : "tst-banner-content-frame"}>
          <div className="container">
            <div className="tst-main-title-frame">
              <div className={showMap ? `tst-main-title${mapProvider === "google" ? " tst-main-title--split" : ""}` : "tst-main-title text-center"}>
                <div className={`tst-suptitle ${showMap ? "": "tst-suptitle-center"} tst-suptitle-mobile-center tst-text-shadow tst-white-2 tst-mb-15`} dangerouslySetInnerHTML={{__html : pageSubTitle}} />
                <h1 className="tst-white-2 tst-text-shadow tst-mb-30" dangerouslySetInnerHTML={{__html : pageTitle}} />
                <div className="tst-text tst-text-shadow tst-text-lg tst-white-2 tst-mb-30" dangerouslySetInnerHTML={{__html : description}} />
                {mapProvider === "google" ? (
                  <div className="tst-banner-split__meta">
                    <a href="tel:0607716979" className="tst-banner-split__chip">
                      <i className="fas fa-phone" aria-hidden="true" />
                      06 07 71 69 79
                    </a>
                    <span className="tst-banner-split__chip">
                      <i className="fas fa-map-marker-alt" aria-hidden="true" />
                      {AppData.settings.googleMaps.address}
                    </span>
                    <a
                      href={getGoogleMapsDirectionsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tst-banner-split__chip tst-banner-split__chip--cta"
                    >
                      <i className="fas fa-directions" aria-hidden="true" />
                      Itinéraire
                    </a>
                  </div>
                ) : null}
                <ul className="tst-breadcrumbs tst-mt-30">
                    <li><Link href="/" className="tst-anima-link">Accueil</Link></li>
                    {asPath.indexOf('/blog/') != -1 && asPath.indexOf('/blog/page/') == -1 &&
                    <li>
                      <Link href="/blog">Blog</Link>
                    </li>
                    }
                    {asPath.indexOf('/products') != -1 || asPath.indexOf('/cart') != -1 || asPath.indexOf('/checkout') != -1 &&
                    <li>
                      <Link href="/shop">Boutique</Link>
                    </li>
                    }
                    {asPath.endsWith('/product') == 1 &&
                    <li>
                      <Link href="/products">Produits</Link>
                    </li>
                    }
                    <li className="tst-active"><a dangerouslySetInnerHTML={{__html : clearBreadTitle}} /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* banner end */}
    </>
  );
};
export default PageBanner;
