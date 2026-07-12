/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@google-analytics/data"],
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
