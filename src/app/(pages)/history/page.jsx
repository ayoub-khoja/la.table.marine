import React, { Suspense } from "react";

import { getSortedPostsData } from "@library/posts";
import { getPageMetadata } from "@library/seo/page-metadata";

import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

import PageBanner from "@components/PageBanner";
import CallToActionSection from "@components/sections/CallToAction";
import LatestPostsSection from "@components/sections/LatestPosts";
import SubscribeSection from "@components/sections/Subscribe";

export const metadata = getPageMetadata("history");

async function History() {
  const posts = await getAllPosts();

  const Content = {
    "subtitle": "Histoire",
    "title": "De délicieuses traditions <br>depuis 1996",
    "description": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur quae repudiandae dolorem, beatae dolorum, praesentium. Cumque, consequatur!"
  }

  const Timeline = [
    {
      "image": {
        "url": "/img/history/1.jpg",
        "alt": "img"
      },
      "title": "Ouverture de notre premier petit restaurant",
      "year": "1996",
      "text": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur."
    },
    {
      "image": {
        "url": "/img/history/2.jpg",
        "alt": "img"
      },
      "title": "Oscar Numan commence à cuisiner <br>pour vous",
      "year": "2001",
      "text": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur."
    },
    {
      "image": {
        "url": "/img/history/3.jpg",
        "alt": "img"
      },
      "title": "Ouverture d’un nouveau restaurant à Londres",
      "year": "2004",
      "text": "Assumenda possimus eaque illo iste, autem. Quod corrupti consectetur cum. Repudiandae dignissimos fugiat sit nam. Tempore aspernatur."
    },
    {
      "image": {
        "url": "/img/history/4.jpg",
        "alt": "img"
      },
      "title": "Ouverture d’un nouveau restaurant à Paris",
      "year": "2010",
      "text": "Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur."
    },
    {
      "image": {
        "url": "/img/history/5.jpg",
        "alt": "img"
      },
      "title": "Obtention d’une <br>étoile Michelin",
      "year": "2012",
      "text": "Assumenda possimus eaque illo iste, autem. Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur."
    },
    {
      "image": {
        "url": "/img/history/6.jpg",
        "alt": "img"
      },
      "title": "Mise en place de la livraison à domicile",
      "year": "2019",
      "text": "Porro eveniet, autem ipsam vitae amet repellat repudiandae tenetur, quod corrupti consectetur cum? Repudiandae dignissimos fugiat sit nam. Tempore aspernatur."
    }
  ];

  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner pageTitle={"Notre histoire"} pageSubTitle={"Depuis 1996"} description={"Quaerat debitis, vel, sapiente dicta sequi <br>labore porro pariatur harum expedita."} breadTitle={"Histoire"} />
      </div>
      <div id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <ScrollHint />

              <div className="row align-items-center flex-sm-row-reverse">

                <div className="col-lg-12">

                  {/* about text */}
                  <div className="tst-mb-60 text-center">
                    <div className="tst-suptitle tst-suptitle-center tst-mb-15" dangerouslySetInnerHTML={{__html : Content.subtitle}} />
                    <h3 className="tst-mb-30" dangerouslySetInnerHTML={{__html : Content.title}} />
                    <p className="tst-text tst-mb-30" dangerouslySetInnerHTML={{__html : Content.description}} />
                  </div>
                  {/* about text end */}

                </div>

                <div className="col-lg-12">

                  <div className="tst-timeline">

                    {Timeline.map((item, key) => (
                    <div className="tst-timeline-item tst-mb-30" key={`history-item-${key}`}>
                      <div className="tst-year tst-mb-15">{item.year}</div>
                      <div className="tst-tl-content">
                        <div className="tst-ilust">
                          <img src={item.image.url} alt={item.image.alt} />
                        </div>
                        <div className="tst-tl-text-frame">
                          <h4 className="tst-mb-30">{item.title}</h4>
                          <p className="tst-text">{item.text}</p>
                        </div>
                      </div>
                    </div>
                    ))}

                  </div>

                </div>

              </div>

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
};
export default History;

async function getAllPosts() {
  const allPosts = getSortedPostsData();
  return allPosts;
}