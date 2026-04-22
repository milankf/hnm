import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/_seating_arrangement",
        destination: "/admin/seating",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
