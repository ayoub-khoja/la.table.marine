import React, { Suspense } from "react";
import dynamic from "next/dynamic";

import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

import PromoBannersSection from "@components/sections/PromoBanners";
import AboutSection from "@components/sections/About";
import FeaturesSection from "@components/sections/Features";
import ScheduleSection from "@components/sections/Schedule";
import CountersSection from "@components/sections/Counters";
import CallToActionSection from "@components/sections/CallToAction";
import LatestPostsSection from "@components/sections/LatestPosts";
import HomeMapInstagramSection from "@components/sections/HomeMapInstagram";
import SubscribeSection from "@components/sections/Subscribe";
import JsonLd from "@components/seo/JsonLd";
import HeroSection from "@components/sections/Hero";
import { buildHomeSchemas } from "@library/seo/json-ld";
import { getPageMetadata } from "@library/seo/page-metadata";

const TestimonialSlider = dynamic( () => import("@components/sliders/Testimonial"), { ssr: false } );

export const metadata = getPageMetadata("home");

async function Home() {
  return (
    <>
      <JsonLd data={buildHomeSchemas()} />
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <HeroSection bgType={"video"} />
      </div>
      <div id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-0">
              <ScrollHint />
            </div>
            <PromoBannersSection />
            <div className="container">
              <AboutSection />
              <Divider />
              <FeaturesSection />
              <Divider />
              <ScheduleSection />
              <Divider onlyBottom={0} />
              <CountersSection />
            </div>
          </div>
        </div>
        <CallToActionSection />
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <TestimonialSlider />
              <Divider onlyBottom={0} />
              <Suspense fallback={<div>Chargement...</div>}>
                <LatestPostsSection />
              </Suspense>
              <Divider onlyBottom={0} />
              <HomeMapInstagramSection />
              <Divider onlyBottom={0} />
              <SubscribeSection />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Home;