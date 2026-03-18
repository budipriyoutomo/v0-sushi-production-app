'use client'

import { useOutlet } from '@/lib/outlet-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Store } from 'lucide-react'

export function OutletSelector() {
  const { selectedOutletId, setSelectedOutletId, outlets, isLoading } = useOutlet()
  const currentOutlet = outlets.find((o) => o.id === selectedOutletId)

  return (
    <Card className="px-4 py-3 border border-border shadow-sm">
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 min-w-[110px]">
      <Store className="w-5 h-5 text-primary" />
      <span className="text-sm font-medium text-muted-foreground">
        Outlet
      </span>
    </div>

    <Select value={selectedOutletId || undefined} onValueChange={setSelectedOutletId} disabled={isLoading}>
      <SelectTrigger className="h-9 bg-background min-w-[140px]">
        <SelectValue placeholder={isLoading ? "Loading..." : "Select outlet"} />
      </SelectTrigger>
      <SelectContent>
        {outlets.map((outlet) => (
          <SelectItem key={outlet.id} value={outlet.id}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{outlet.name}</span>
              <span className="text-xs text-muted-foreground">
                ({outlet.code})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</Card>
  )
}
