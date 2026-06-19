import withPWAInit from "next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: "/login/kitchen",
  // Jangan reload halaman penuh saat koneksi kembali. Pada internet yang
  // tidak stabil, event online/offline berkedip terus dan reloadOnOnline
  // memicu full reload berulang (terasa lemot/berkedip). Pemulihan koneksi
  // sudah ditangani ConnectivityMonitor (drain queue) + SWR revalidateOnReconnect.
  reloadOnOnline: false,
  clientsClaim: true,
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "font-cache",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-cache",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/") || url.href.includes("/api/"),
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "api-runtime-cache",
        // 8 detik terlalu lama untuk UI dapur interaktif: pada jaringan lambat
        // setiap GET "menggantung" sampai 8s sebelum fallback ke cache. 3 detik
        // tetap memberi jaringan kesempatan tapi cepat jatuh ke data cache.
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 5,
        },
      },
    },
    {
      // Navigasi halaman (hard refresh / buka langsung URL). Tanpa ini, pada
      // jaringan lambat browser menunggu server lama sebelum render. NetworkFirst
      // dengan timeout 3s menyajikan shell halaman dari cache lalu fallback ke
      // /offline jika benar-benar tidak ada koneksi.
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
}

export default withPWA(nextConfig)
