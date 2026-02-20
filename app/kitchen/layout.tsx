import { KitchenHeaderToolbar } from '@/components/kitchen-header-toolbar'

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <KitchenHeaderToolbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
