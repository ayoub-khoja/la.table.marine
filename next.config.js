/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@google-analytics/data",
      "@vercel/blob",
      "sharp",
      "qrcode",
    ],
    outputFileTracingIncludes: {
      "/api/admin/menu/qr": [
        "./public/img/logo-blanc.png",
        "./public/img/logo-sans-texte.png",
        "./public/img/qr/**/*",
        "./src/app/_lib/shared/fonts/**/*",
      ],
      "/api/qr-code/avis-google": [
        "./public/img/logo-blanc.png",
        "./src/app/_lib/shared/fonts/**/*",
      ],
    },
  },
  async redirects() {
    return [
      { source: "/home-2", destination: "/", permanent: true },
      { source: "/home-3", destination: "/", permanent: true },
      { source: "/onepage", destination: "/", permanent: true },
      { source: "/menu-2", destination: "/menu", permanent: true },
      { source: "/shop", destination: "/", permanent: true },
      { source: "/products", destination: "/", permanent: true },
      { source: "/product", destination: "/", permanent: true },
      { source: "/reservation-2", destination: "/reservation", permanent: true },
      { source: "/cart", destination: "/", permanent: true },
      { source: "/checkout", destination: "/", permanent: true },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
