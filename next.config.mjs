import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: "/login/kitchen",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack:{},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
 
}

export default withPWA(nextConfig)
