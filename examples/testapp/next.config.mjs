import webpack from 'webpack';

export default {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/account-sdk' : undefined,
  pageExtensions: ['page.tsx', 'page.ts', 'page.js', 'page.jsx'],
  eslint: {
    // Ignore eslint for `next lint`.
    // GitHub discussion for supporting biome: https://github.com/vercel/next.js/discussions/59347
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude Node.js built-in modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        zlib: false,
      };
      
      // Ignore node:zlib imports in client-side code
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^node:zlib$/,
        })
      );
    }
    return config;
  },
};
