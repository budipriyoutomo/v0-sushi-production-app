import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, ShieldCheck, ChevronRight } from "lucide-react" // Pastikan sudah install lucide-react

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] p-4 antialiased relative">
      {/* Garis aksen minimalis hijau mewah di bagian atas layar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-emerald-600" />

      <Card className="w-full max-w-sm border-stone-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl">
        <CardHeader className="space-y-4 text-center pt-8 pb-4">
          <div className="flex justify-center">
            {/* Area logo yang bersih dan proporsional */}
            <div className="relative w-24 h-24">
              <Image
                src="/Maharasa Logo_FA-01.png"
                alt="Maharasa Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight text-stone-800">
              Sushi Production System
            </CardTitle>
            <CardDescription className="text-xs text-stone-400">
              Select your login method to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-6 pb-8">
          {/* Opsi Login: Kitchen */}
          <Link href="/login/kitchen" className="block group">
            <div className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/10 active:scale-[0.99] transition-all duration-200 text-left cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800 group-hover:text-stone-900">
                    Kitchen (PIN)
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Akses cepat area produksi dashboard
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Opsi Login: Admin */}
          <Link href="/login/admin" className="block group">
            <div className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/10 active:scale-[0.99] transition-all duration-200 text-left cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800 group-hover:text-stone-900">
                    Admin
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Manajemen sistem, outlet & laporan
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}