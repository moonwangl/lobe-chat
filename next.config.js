/** @type {import('next').NextConfig} */

const nextConfig = {
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  compiler: {
    emotion: true,
  },
  compress: process.env.NODE_ENV === 'production',
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      'emoji-mart',
      '@emoji-mart/react',
      '@emoji-mart/data',
      '@icons-pack/react-simple-icons',
      '@lobehub/ui',
      '@lobehub/icons',
      'gpt-tokenizer',
    ],
    serverMinification: false,
    webVitalsAttribution: ['CLS', 'LCP'],
    webpackMemoryOptimizations: true,
  },
  
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
output: 'standalone',
  // Ensure standalone output is generated for Docker
outputFileTracing: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // to fix shikiji compile error
    config.module.rules.push({
      resolve: {
        fullySpecified: false,
      },
      test: /\.m?js$/,
      type: 'javascript/auto',
    });

    config.externals.push('pino-pretty');
    config.resolve.alias.canvas = false;

    // to ignore epub2 compile error
    config.resolve.fallback = {
      ...config.resolve.fallback,
      zipfile: false,
    };

    return config;
  },
};

module.exports = nextConfig;
