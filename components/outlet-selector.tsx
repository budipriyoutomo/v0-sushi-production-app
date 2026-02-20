'use client'

import { useOutlet } from '@/lib/outlet-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Store } from 'lucide-react'

export function OutletSelector() {
  const { selectedOutletId, setSelectedOutletId, outlets } = useOutlet()
  const currentOutlet = outlets.find((o) => o.id === selectedOutletId)

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <Store className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Current Outlet</label>
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
            <SelectTrigger className="w-full bg-background mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {outlets.map((outlet) => (
                <SelectItem key={outlet.id} value={outlet.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{outlet.name}</span>
                    <span className="text-xs text-muted-foreground">({outlet.code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="text-sm font-semibold">{currentOutlet?.location}</p>
        </div>
      </div>
    </Card>
  )
}
