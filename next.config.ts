import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: process.env.BASEPATH,
  // Disable ESLint during production builds to avoid build failures due to linting errors
  eslint: {
    ignoreDuringBuilds: true
  },
  // Disable TypeScript errors during builds (already checked in development)
  typescript: {
    ignoreBuildErrors: false // Keep this false to catch real TypeScript errors
  },
  // Removed static redirect - now handled by middleware based on user role
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'm.gjcdn.net'
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com'
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com'
      }
    ]
  }
}

export default nextConfig
