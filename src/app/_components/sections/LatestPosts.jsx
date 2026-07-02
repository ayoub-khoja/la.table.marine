import dynamic from "next/dynamic";

const GallerySection = dynamic(() => import("@components/sections/Gallery"), {
  ssr: false,
});

const LatestPostsSection = () => {
  return <GallerySection />;
};

export default LatestPostsSection;
