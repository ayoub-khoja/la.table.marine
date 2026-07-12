import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { notFound } from 'next/navigation';

import PageBanner from "@components/PageBanner";
import Sidebar from "@components/Sidebar";
import PopularPosts from "@components/sections/PopularPosts";
import ScrollHint from "@layouts/scroll-hint/Index";
import Divider from "@layouts/divider/Index";

import { getAllTagsIds, getTagData } from "@library/tags";
import { getTagPosts, getFeaturedPostsData } from "@library/posts";
import { buildDynamicPageMetadata } from "@library/seo/page-metadata";

import PopularsPostsData from "@data/sections/popular-posts.json";

const BlogPaginated = dynamic( () => import("@components/blog/BlogPaginated"), { ssr: false } );

export async function generateMetadata({ params }) {
  const tagData = await getSingleTagData(params);

  return buildDynamicPageMetadata({
    title: `${tagData.title} | Blog`,
    description: `Articles tagués « ${tagData.title} » sur le blog de La Table Marine.`,
    path: `/blog/tag/${params.id}`,
  });
}

async function BlogTag( { params } ) {
  const populars = await getAllPupulars();
  const posts = await getAllPosts(params);
  const tagData = await getSingleTagData(params);

  return (
    <>
      <div id="tst-dynamic-banner" className="tst-dynamic-banner">
        <PageBanner pageTitle={"Tag : "+tagData.title} description={"Articles associés au tag « "+tagData.title+" » sur le blog de La Table Marine."} breadTitle={tagData.title} />
      </div>
      <div id="tst-dynamic-content" className="tst-dynamic-content">
        <div className="tst-content-frame">
          <div className="tst-content-box">
            <div className="container tst-p-60-60">
              <ScrollHint />

              <div className="row">

                <div className="col-lg-8">

                  <BlogPaginated
                    items={posts}
                    columns={2}
                  />

                </div>
                <div className="col-lg-4">
                  <div className="tst-sidebar-frame tst-pad-type-1">
                    <Sidebar />
                  </div>
                </div>
                
              </div>

              <Divider onlyBottom={0} />
              <Suspense fallback={<div>Chargement...</div>}>
                <PopularPosts posts={populars} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default BlogTag;

export async function generateStaticParams() {
    const paths = getAllTagsIds()
    return paths
}

async function getAllPupulars() {
    const popularsData = await getFeaturedPostsData( PopularsPostsData.featured )
  
    return popularsData
}

async function getSingleTagData(params) {
    const tagData = await getTagData(params.id)

    if ( !tagData ) {
        notFound()
    } else {
        return tagData
    }
}

async function getAllPosts( params ) {
    const tagPosts = await getTagPosts(params.id)

    if (!tagPosts.length) {
        notFound()
    }

    return tagPosts
}