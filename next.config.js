const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

const withPWA = require("next-pwa")({
  dest: "public"
})

module.exports = withBundleAnalyzer(
  withPWA({
    reactStrictMode: true,
    images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost"
        },
        {
          protocol: "http",
          hostname: "127.0.0.1"
        },
        {
          protocol: "https",
          hostname: "**"
        }
      ]
    },
    experimental: {
      serverComponentsExternalPackages: ["sharp", "onnxruntime-node"]
    },
    async redirects() {
      return [
        {
          source: '/',
          destination: '/ca8495a8-53e1-4de7-b8e0-8dbfad604f07/chat',
          permanent: false,
        },
      ]
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  })
)
