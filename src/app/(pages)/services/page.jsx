import React, { Suspense } from "react";
import { notFound } from "next/navigation";

import { getSortedPostsData } from "@library/posts";
import { getPageMetadata } from "@library/seo/page-metadata";

import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

import PageBanner from "@components/PageBanner";
import ServiceItem from "@components/services/ServiceItem";
import CallToActionSection from "@components/sections/CallToAction";
import LatestPostsSection from "@components/sections/LatestPosts";
import SubscribeSection from "@components/sections/Subscribe";

// Metadata noindex — contenu template en attente de validation éditoriale réelle.
export const metadata = getPageMetadata("services");

// Page temporairement désactivée jusqu'à validation du contenu réel.
export default function ServicesPage() {
  notFound();
}

// Contenu template conservé pour une future réactivation.
async function ServicesPageContent() {
  const posts = await getAllPosts();

  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner pageTitle={"Pourquoi nous choisir ?"} description={"Quaerat debitis, vel, sapiente dicta sequi <br>labore porro pariatur harum expedita."} breadTitle={"Services"} />
      </div>
      <div id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-0">
              <ScrollHint />

              <ServiceItem
                content={
                  {
                    "subtitle": "Services",
                    "title": "Un lieu chaleureux créé <br>par des designers reconnus",
                    "description": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur quae repudiandae dolorem, beatae dolorum, praesentium itaque et quam quaerat. Cumque, consequatur!"
                  }
                }
                button={
                  {
                    "label": "En savoir plus",
                    "link": "/about"
                  }
                }
                image={
                 {
                  "url": "/img/services/1.jpg",
                  "alt": "cover"
                 }
                }
                rowReverse={1}
              />

              <Divider />

              <ServiceItem
                content={
                  {
                    "subtitle": "Services",
                    "title": "Des ingrédients frais <br>issus de fermes bio",
                    "description": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur quae repudiandae dolorem, beatae dolorum, praesentium itaque et quam quaerat. Cumque, consequatur!"
                  }
                }
                button={
                  {
                    "label": "En savoir plus",
                    "link": "/about"
                  }
                }
                image={
                 {
                  "url": "/img/services/2.jpg",
                  "alt": "cover"
                 }
                }
              />

              <Divider />

              <ServiceItem
                content={
                  {
                    "subtitle": "Services",
                    "title": "12 belles années <br>d’expérience",
                    "description": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur quae repudiandae dolorem, beatae dolorum, praesentium itaque et quam quaerat. Cumque, consequatur!"
                  }
                }
                button={
                  {
                    "label": "En savoir plus",
                    "link": "/about"
                  }
                }
                image={
                 {
                  "url": "/img/services/3.jpg",
                  "alt": "cover"
                 }
                }
                rowReverse={1}
              />

            </div>
          </div>
        </div>
        <CallToActionSection />
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <Suspense fallback={<div>Chargement...</div>}>
                <LatestPostsSection posts={posts} />
              </Suspense>
              <Divider onlyBottom={0} />
              <SubscribeSection />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function getAllPosts() {
  const allPosts = getSortedPostsData();
  return allPosts;
}
