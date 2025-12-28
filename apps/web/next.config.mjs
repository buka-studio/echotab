/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@echotab/ui"],
  experimental: {
    externalDir: true,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        cleanupIds: false,
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
        as: "*.js",
      },
      "*.{vert,frag}": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
