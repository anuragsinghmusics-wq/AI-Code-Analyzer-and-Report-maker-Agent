/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@code-analyzer/shared',
    '@code-analyzer/db',
  ],
  experimental: {
    // Required for next-auth in App Router
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx']
    };
    return config;
  },
};

module.exports = nextConfig;
