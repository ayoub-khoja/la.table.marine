import React from "react";
import dynamic from "next/dynamic";

import AppData from "@data/app.json";
import { getPageMetadata } from "@library/seo/page-metadata";
import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

import Products from '@data/products';

import PageBanner from "@components/PageBanner";
import SubscribeSection from "@components/sections/Subscribe";
import TeamSection from "@components/sections/Team";

const ProductsSlider = dynamic( () => import("@components/sliders/Products"), { ssr: false } );

export const metadata = getPageMetadata("shop");

const Shop = () => {
  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
          <PageBanner pageTitle={"Boutique"} description={"Quaerat debitis, vel, sapiente dicta sequi <br>labore porro pariatur harum expedita."} breadTitle={"Boutique en ligne"} />
      </div>
      <div id="tst-dynamic-content" className="tst-dynamic-content">
          <div className="tst-content-frame">
              <div className="tst-content-box">
                  <div className="container tst-p-60-60">
                      <ScrollHint />

                      <ProductsSlider 
                        items={Products.collection['popular']} 
                        heading={
                          { 
                            "subtitle": "Populaires", 
                            "title": "Plats les plus populaires", 
                            "description": "Porro eveniet, autem ipsam corrupti consectetur cum. <br>Repudiandae dignissimos fugiat sit nam." 
                          }
                        }
                        button={
                          {
                            "link": "/products",
                            "label": "Voir tout"
                          }
                        }
                      />
                      <Divider onlyBottom={0} />
                      <ProductsSlider 
                        items={Products.collection['bestseller']} 
                        heading={
                          { 
                            "subtitle": "Meilleures ventes", 
                            "title": "Nos best-sellers", 
                            "description": "Porro eveniet, autem ipsam corrupti consectetur cum. <br>Repudiandae dignissimos fugiat sit nam." 
                          }
                        }
                        button={
                          {
                            "link": "/products",
                            "label": "Voir tout"
                          }
                        }
                      />
                      <Divider onlyBottom={0} />
                      <TeamSection />
                      <Divider onlyBottom={0} />
                      <SubscribeSection />
                      
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};
export default Shop;