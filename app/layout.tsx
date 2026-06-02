import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maharasa Production System",
  description: "Internal restaurant production management system",
  applicationName: "Maharasa Production System",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Maharasa",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/pwa-icon-192.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/pwa-icon-192.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/maharasa_180x180-01.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/maharasa_180x180-01.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
          <Providers> 
          {children}
         </Providers>  
        <Analytics />
      </body>
    </html>
  )
}
