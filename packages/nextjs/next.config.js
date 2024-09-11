// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  images: { unoptimized: true },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async headers() {
    if ('CSP_FRAMES' in process.env) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: "Content-Security-Policy",
              value: `frame-ancestors ${process.env.CSP_FRAMES}`
            }
          ]
        }
      ]
    } else {
      return [];
    }
  },
  // the following doesn't seem to work, see instead package.json "build" script containing "tsc --build" and tsconfig.json "refereences" setting
  transpilePackages: ['@10tance/map']
};

module.exports = nextConfig;
