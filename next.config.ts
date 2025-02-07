const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.NODE_ENV === "development"
            ? "bfnevuiuzigykvlsnoea.supabase.co"
            : "kvrvtcwffqhkzlpfjjoy.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: `${process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://loadbalancer.elevateglobal.app"}/socket.io/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NODE_ENV === "development" ? "http://localhost:9000" : "https://loadbalancer.elevateglobal.app"}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS", // Specify allowed methods
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With, Accept", // Add required headers
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "X-Powered-By",
            value: "",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
