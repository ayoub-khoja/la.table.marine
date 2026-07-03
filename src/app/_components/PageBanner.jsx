"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

import { ScrollAnimation } from "@common/scrollAnims";
import { mapboxInit } from "@common/mapboxInit";
import GoogleMapEmbed from "@components/maps/GoogleMapEmbed";
import AppData from "@data/app.json";
import { getGoogleMapsDirectionsUrl, getGoogleMapsPlaceUrl } from "@library/maps/google";

const PageBanner = ({ pageTitle, pageSubTitle = false, description, breadTitle, showMap = 0, mapProvider = "mapbox", bannerImage = "/img/banners/banner-sm-1.jpg", bannerImageAlt = "cover", bannerLayout = "default" }) => {
  const asPath = usePathname();
  const [mapLock, setMapLock] = useState(false);
  const [googleMapActive, setGoogleMapActive] = useState(false);

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
      <div className={`tst-banner tst-small-banner${showMap && mapProvider === "google" ? " tst-banner--split-map" : ""}${bannerLayout === "split-photo" ? " tst-banner--split-photo" : ""}`}>
        {showMap ? (
        mapProvider === "google" ? (
        <div className="tst-cover-frame tst-cover-frame--split">
          <div className="tst-banner-split__right">
            <div className={`tst-banner-split__map-shell${googleMapActive ? " tst-banner-split__map-shell--active" : " tst-banner-split__map-shell--pending"}`}>
              {googleMapActive ? (
                <div className="tst-banner-split__place-card">
                  <div className="tst-banner-split__place-card__body">
                    <h3 className="tst-banner-split__place-card__title">
                      {AppData.settings.googleMaps.name} Plaisir
                    </h3>
                    <p className="tst-banner-split__place-card__address">
                      {AppData.settings.googleMaps.fullAddress || AppData.settings.googleMaps.address}
                    </p>
                    {AppData.settings.googleMaps.rating ? (
                      <div className="tst-banner-split__place-card__rating">
                        <span className="tst-banner-split__place-card__score">
                          {AppData.settings.googleMaps.rating.toFixed(1)}
                        </span>
                        <i className="fas fa-star" aria-hidden="true" />
                        {AppData.settings.googleMaps.reviewCount ? (
                          <a
                            href={getGoogleMapsPlaceUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tst-banner-split__place-card__reviews"
                          >
                            ({AppData.settings.googleMaps.reviewCount})
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="tst-banner-split__place-card__actions">
                    <a
                      href={getGoogleMapsPlaceUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tst-banner-split__place-card__action"
                      aria-label="Ouvrir dans Google Maps"
                    >
                      <i className="fas fa-external-link-alt" aria-hidden="true" />
                    </a>
                    <a
                      href={getGoogleMapsDirectionsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tst-banner-split__place-card__action"
                      aria-label="Obtenir l'itinéraire"
                    >
                      <i className="fas fa-directions" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              ) : null}
              <div className="tst-map-frame">
                <div className={`tst-map tst-map--google tst-map--split${googleMapActive ? " tst-active" : ""}`}>
                  <GoogleMapEmbed
                    isActive={googleMapActive}
                    title="Localisation — La Table Marine"
                  />
                </div>
              </div>
              {!googleMapActive ? (
                <div className="tst-banner-split__map-cta">
                  <p className="tst-banner-split__map-hint">
                    <span className="tst-banner-split__map-hint__long">
                      Cliquez pour afficher la carte interactive Google Maps
                    </span>
                    <span className="tst-banner-split__map-hint__short">
                      Appuyez sur Interagir pour voir la carte
                    </span>
                  </p>
                  <button
                    type="button"
                    className="tst-lock tst-lock--split"
                    onClick={() => setGoogleMapActive(true)}
                    aria-label="Afficher la carte Google Maps"
                  >
                    <i className="fas fa-map-marked-alt" aria-hidden="true" />
                    <span>Interagir</span>
                  </button>
                </div>
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
        ) : bannerLayout === "split-photo" ? (
        <div className="tst-cover-frame tst-cover-frame--split-photo">
          <div className="tst-banner-split__photo-shell">
            <img src={bannerImage} alt={bannerImageAlt} className="tst-cover tst-cover--split-photo" />
          </div>
        </div>
        ) : (
        <div className="tst-cover-frame"> 
          <img src={bannerImage} alt={bannerImageAlt} className="tst-cover" />
          <div className="tst-overlay"></div>
        </div>
        )}
        <div className={
          showMap
            ? `tst-banner-content-frame tst-with-map ${mapLock ? "tst-active" : ""}${mapProvider === "google" ? " tst-banner-content-frame--split" : ""}`
            : bannerLayout === "split-photo"
              ? "tst-banner-content-frame tst-banner-content-frame--split"
              : "tst-banner-content-frame"
        }>
          <div className="container">
            <div className="tst-main-title-frame">
              <div className={
                showMap
                  ? `tst-main-title${mapProvider === "google" ? " tst-main-title--split" : ""}`
                  : bannerLayout === "split-photo"
                    ? "tst-main-title tst-main-title--split"
                    : "tst-main-title text-center"
              }>
                <div className={`tst-suptitle ${showMap || bannerLayout === "split-photo" ? "" : "tst-suptitle-center"} tst-suptitle-mobile-center ${showMap || bannerLayout === "split-photo" ? "" : "tst-text-shadow"} tst-white-2 tst-mb-15`} dangerouslySetInnerHTML={{__html : pageSubTitle}} />
                <h1 className={`tst-white-2 ${showMap || bannerLayout === "split-photo" ? "" : "tst-text-shadow"} tst-mb-30`} dangerouslySetInnerHTML={{__html : pageTitle}} />
                <div className={`tst-text ${showMap || bannerLayout === "split-photo" ? "" : "tst-text-shadow"} tst-text-lg tst-white-2 tst-mb-30`} dangerouslySetInnerHTML={{__html : description}} />
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
