import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: false,
  api: {
    bodyParser: {
      sizeLimit: "5mb", // Set the new limit to 5MB
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
