import { KitchenPinLogin } from "@/components/kitchen-pin-login"

export default function KitchenLoginPage() {
  return ( 
    <div className="fixed inset-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 touch-none text-foreground">
      <KitchenPinLogin />
    </div> 
  )
}
