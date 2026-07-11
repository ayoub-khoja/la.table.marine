"use client";

import { useState } from "react";
import Image from "next/image";

import AppData from "@data/app.json";
import Data from "@data/sections/home-map-instagram.json";
import GoogleMapEmbed from "@components/maps/GoogleMapEmbed";
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsPlaceUrl,
} from "@library/maps/google";

const HomeMapInstagramSection = () => {
  const [googleMapActive, setGoogleMapActive] = useState(false);
  const { googleMaps } = AppData.settings;

  return (
    <section
      className="tst-home-map-instagram tst-mb-60"
      aria-label="Localisation et Instagram"
    >
      <div className="tst-home-map-instagram__grid">
        <div className="tst-home-map-instagram__map">
          <div
            className={`tst-home-map-instagram__map-shell${
              googleMapActive ? " is-active" : " is-pending"
            }`}
          >
            {googleMapActive ? (
              <div className="tst-home-map-instagram__place-card">
                <div className="tst-home-map-instagram__place-card-body">
                  <h3>{googleMaps.name} Plaisir</h3>
                  <p>
                    {googleMaps.fullAddress || googleMaps.address}
                  </p>
                  {googleMaps.rating ? (
                    <div className="tst-home-map-instagram__place-card-rating">
                      <span>{googleMaps.rating.toFixed(1)}</span>
                      <i className="fas fa-star" aria-hidden="true" />
                      {googleMaps.reviewCount ? (
                        <a
                          href={getGoogleMapsPlaceUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ({googleMaps.reviewCount})
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="tst-home-map-instagram__place-card-actions">
                  <a
                    href={getGoogleMapsPlaceUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ouvrir dans Google Maps"
                  >
                    <i className="fas fa-external-link-alt" aria-hidden="true" />
                  </a>
                  <a
                    href={getGoogleMapsDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Obtenir l'itinéraire"
                  >
                    <i className="fas fa-directions" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : null}

            <div className="tst-home-map-instagram__map-frame">
              <div
                className={`tst-map tst-map--google${
                  googleMapActive ? " tst-active" : ""
                }`}
              >
                <GoogleMapEmbed
                  isActive={googleMapActive}
                  title="Localisation — La Table Marine"
                />
              </div>
            </div>

            {!googleMapActive ? (
              <div className="tst-home-map-instagram__map-cta">
                <p>Cliquez pour afficher la carte interactive Google Maps</p>
                <button
                  type="button"
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

        <a
          href={Data.instagram.link}
          className="tst-home-map-instagram__instagram"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={Data.instagram.alt}
        >
          <Image
            src={Data.instagram.image}
            alt={Data.instagram.alt}
            width={1536}
            height={1024}
            sizes="(max-width: 991px) 100vw, 50vw"
            className="tst-home-map-instagram__instagram-image"
          />
        </a>
      </div>
    </section>
  );
};

export default HomeMapInstagramSection;
