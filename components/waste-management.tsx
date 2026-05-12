"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OutletSelector } from "@/components/outlet-selector"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { useOutlet } from "@/lib/outlet-context"
import { usePlateColors } from "@/hooks/use-plate-colors"
import { useToast } from "@/hooks/use-toast"
import { wasteService, type WasteSummary } from "@/lib/api"
import { Loader2, Search, Calendar, Eye } from "lucide-react"

interface WasteEntryLocal {
  id: string
  time: string
  sushiName: string
  plateColor: string
  plateColorId: string
  quantity: number
  reason: string
}

interface GroupedWasteEntry {
  key: string
  sushiName: string
  plateColor: string
  plateColorId: string
  quantity: number
  reason: string
  entries: WasteEntryLocal[]
}

export function WasteManagement() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const { plateColors, isLoading: isLoadingPlateColors } = usePlateColors()
  
  const [filterColorId, setFilterColorId] = useState<string>("all")
  const [entries, setEntries] = useState<WasteEntryLocal[]>([])
  const [summary, setSummary] = useState<WasteSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<GroupedWasteEntry | null>(null)

  // Filter entries by selected plate color
  const filteredEntries = entries.filter((entry) => {
    if (filterColorId === "all") return true
    return entry.plateColorId === filterColorId
  })

  // Group entries by menu, plate color, and reason. Quantity is summarized per group.
  const groupedEntries = useMemo(() => {
    const groups: Record<string, GroupedWasteEntry> = {}
    
    filteredEntries.forEach((entry) => {
      const key = `${entry.sushiName}-${entry.plateColorId}-${entry.reason}`
      if (!groups[key]) {
        groups[key] = {
          key,
          sushiName: entry.sushiName,
          plateColor: entry.plateColor,
          plateColorId: entry.plateColorId,
          quantity: 0,
          reason: entry.reason,
          entries: [],
        }
      }
      groups[key].quantity += entry.quantity
      groups[key].entries.push(entry)
    })
    
    return Object.values(groups)
      .map((group) => ({
        ...group,
        entries: group.entries.sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .sort((a, b) =>
        a.sushiName.localeCompare(b.sushiName) ||
        a.plateColor.localeCompare(b.plateColor) ||
        a.reason.localeCompare(b.reason)
      )
  }, [filteredEntries])

  const handleViewDetail = (group: GroupedWasteEntry) => {
    setSelectedGroup(group)
    setDetailDialogOpen(true)
  }

  // Calculate waste stats per plate color from summary or entries
  const getWasteStats = () => {
    const stats: Record<string, { count: number; production: number }> = {}
    
    // Initialize all plate colors with 0
    plateColors.forEach(pc => {
      stats[pc.id] = { count: 0, production: 0 }
    })

    // Use summary data if available
    if (summary?.byPlateColor) {
      summary.byPlateColor.forEach((item) => {
        if (stats[item.plateColorId]) {
          stats[item.plateColorId].count = item.wasteCount
          stats[item.plateColorId].production = item.productionCount
        }
      })
    } else {
      // Fallback: calculate from entries
      entries.forEach((entry) => {
        if (stats[entry.plateColorId]) {
          stats[entry.plateColorId].count += entry.quantity
        }
      })
    }

    return stats
  }

  // Fetch waste data from API
  const handleFetchWasteData = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Fetch both waste entries and summary in parallel
      const [wasteEntries, wasteSummary] = await Promise.all([
        wasteService.getAll({ outletId: selectedOutletId, date: selectedDate }),
        wasteService.getSummary({ outletId: selectedOutletId, date: selectedDate }),
      ])

      // Transform API entries to local format
      const transformedEntries: WasteEntryLocal[] = wasteEntries.map((entry) => ({
        id: entry.id,
        time: entry.time,
        sushiName: entry.menuName || '-',
        plateColor: entry.plateColorName || entry.plateColorId,
        plateColorId: entry.plateColorId,
        quantity: entry.quantity,
        reason: entry.reason || '-',
      }))

      setEntries(transformedEntries)
      setSummary(wasteSummary)

      toast({
        title: 'Success',
        description: `Loaded ${transformedEntries.length} waste entries`,
      })
    } catch (error) {
      console.error('Failed to fetch waste data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch waste data',
        variant: 'destructive',
      })
      setEntries([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = getWasteStats()
  // Use summary data if available, otherwise calculate from stats
  const totalWaste = summary?.totalWaste ?? Object.values(stats).reduce((sum, stat) => sum + stat.count, 0)
  const totalProduction = summary?.totalProduction ?? 0
  const wastePercentage = summary?.wastePercentage?.toFixed(2) ?? (totalProduction > 0 ? ((totalWaste / totalProduction) * 100).toFixed(2) : '0.00')

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Waste Management</h1>
          <p className="text-muted-foreground mt-1">Track and analyze production waste</p>
        </div>

        {/* Filter Bar - Outlet, Date, Fetch Button */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 min-w-0">
                <OutletSelector />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 bg-background w-[160px]"
                />
              </div>
              <Button
                onClick={handleFetchWasteData}
                disabled={isLoading || !selectedOutletId}
                className="h-10 px-5 shrink-0"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" />Fetch Data</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row: Plate Colors Card + Summary Card - Same Size */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Plate Colors Card — all from master, default 0 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Waste by Plate Color</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingPlateColors ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : plateColors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No plate colors found in master data</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {plateColors.map((pc) => (
                    <div key={pc.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                      <PlateColorBadge color={pc.platename} />
                      <span className="text-lg font-bold tabular-nums">{stats[pc.id]?.count ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card — Total Waste, Total Production, % Waste - Horizontal Layout */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Total Waste</p>
                  <p className="text-xl font-bold tabular-nums">{totalWaste}</p>
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Total Production</p>
                  <p className="text-xl font-bold tabular-nums">{totalProduction}</p>
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">% Waste</p>
                  <p className="text-xl font-bold tabular-nums">
                    {wastePercentage}
                    <span className="text-sm font-medium text-muted-foreground">%</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waste Log */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Waste Log</CardTitle>
              <Select value={filterColorId} onValueChange={setFilterColorId}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {plateColors.filter(pc => pc.isActive).map((plateColor) => (
                    <SelectItem key={plateColor.id} value={plateColor.id}>
                      {plateColor.platename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu Name</TableHead>
                    <TableHead>Plate Color</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-center w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {!selectedOutletId 
                          ? 'Please select an outlet and click "Fetch Data" to view waste entries'
                          : 'No waste entries found. Click "Fetch Data" to load data.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupedEntries.map((group) => (
                      <TableRow key={group.key}>
                        <TableCell className="font-medium">{group.sushiName}</TableCell>
                        <TableCell>
                          <PlateColorBadge color={group.plateColor} />
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{group.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{group.reason}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(group)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Waste Detail - {selectedGroup?.sushiName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Plate Color:</span>
                  {selectedGroup && <PlateColorBadge color={selectedGroup.plateColor} />}
                </div>
                <div>
                  <span className="text-muted-foreground">Qty:</span>{' '}
                  <span className="font-medium">{selectedGroup?.quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reason:</span>{' '}
                  <span className="font-medium">{selectedGroup?.reason}</span>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>Menu Name</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroup?.entries.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="tabular-nums">
                          {entry.time}
                        </TableCell>
                        <TableCell className="font-medium">{entry.sushiName}</TableCell>
                        <TableCell className="text-center tabular-nums">{entry.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
