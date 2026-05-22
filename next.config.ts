import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard/initiatives/:path*",
        destination: "/dashboard/acciones/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/explore",
        destination: "/acciones",
        permanent: false,
      },
      {
        source: "/dashboard/initiatives/new",
        destination: "/acciones/nueva",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
