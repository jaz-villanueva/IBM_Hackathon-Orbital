/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images-assets.nasa.gov' },
      { protocol: 'https', hostname: 'mars.nasa.gov' },
      { protocol: 'https', hostname: 'photojournal.jpl.nasa.gov' },
      { protocol: 'https', hostname: 'www.nasa.gov' },
      { protocol: 'https', hostname: 'solarsystem.nasa.gov' },
      { protocol: 'https', hostname: 'science.nasa.gov' },
      { protocol: 'https', hostname: 'www.esa.int' },
      { protocol: 'https', hostname: 'esatellites.org' },
    ],
  },
  serverExternalPackages: [],
};

module.exports = nextConfig;
