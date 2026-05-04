'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { useOutlet } from '@/lib/outlet-context'
import { OutletSelector } from '@/components/outlet-selector'
import { productionService, type ProductionItem } from '@/lib/api/services/production'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, RefreshCw, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

type SortKey = keyof ProductionItem
type SortDir = 'asc' | 'desc'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm')
  } catch {
    return value
  }
}

function BeltStatusBadge({ status }: { status: ProductionItem['beltStatus'] }) {
  const styles: Record<string, string> = {
    fresh: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    expired: 'bg-red-100 text-red-800 border border-red-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

function FinalStatusBadge({ status }: { status: ProductionItem['finalStatus'] }) {
  if (!status) return <span className="text-muted-foreground text-xs">-</span>
  const styles: Record<string, string> = {
    sold: 'bg-blue-100 text-blue-800 border border-blue-300',
    waste: 'bg-orange-100 text-orange-800 border border-orange-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

export function ProductionItemList() {
  const { selectedOutletId } = useOutlet()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState('')
  const [plateColorFilter, setPlateColorFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('producedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const { data, isLoading, mutate } = useSWR<ProductionItem[]>(
    selectedOutletId && date ? ['production-item-list', selectedOutletId, date] : null,
    async () => productionService.getProductionItemList({ outletId: selectedOutletId, date }),
    { revalidateOnFocus: false }
  )

  const items = data || []

  // Unique plate colors derived from loaded data
  const plateColorOptions = Array.from(
    new Map(items.map(i => [i.plateColorName, i.plateColorName])).entries()
  )
    .filter(([name]) => !!name)
    .sort(([a], [b]) => a.localeCompare(b))

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchesSearch =
      item.menuName?.toLowerCase().includes(q) ||
      item.plateColorName?.toLowerCase().includes(q) ||
      item.beltStatus?.toLowerCase().includes(q) ||
      (item.finalStatus ?? '').toLowerCase().includes(q)
    const matchesColor =
      plateColorFilter === 'all' || item.plateColorName === plateColorFilter
    return matchesSearch && matchesColor
  })

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey] ?? ''
    const bVal = b[sortKey] ?? ''
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalItems = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />
  }

  const handleExport = () => {
    if (!sorted.length) return
    const headers = ['Menu', 'Plate Color', 'Qty', 'Produced At', 'Expired At', 'Belt Status', 'Final Status', 'Sold At', 'Wasted At', 'Notes']
    const rows = sorted.map((item: ProductionItem) => [
      item.menuName,
      item.plateColorName,
      item.quantity,
      formatDateTime(item.producedAt),
      formatDateTime(item.expiresAt),
      item.beltStatus,
      item.finalStatus ?? '',
      formatDateTime(item.soldAt),
      formatDateTime(item.wastedAt),
      item.notes ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `production-items-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: 'menuName', label: 'Menu' },
    { key: 'plateColorName', label: 'Plate Color' },
    { key: 'quantity', label: 'Qty' },
    { key: 'producedAt', label: 'Produced At' },
    { key: 'expiresAt', label: 'Expired At' },
    { key: 'beltStatus', label: 'Belt Status' },
    { key: 'finalStatus', label: 'Final Status' },
    { key: 'soldAt', label: 'Sold At' },
    { key: 'wastedAt', label: 'Wasted At' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Production Item List</h1>
          <p className="text-muted-foreground mt-1">Detail produksi per item berdasarkan tanggal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={!sorted.length}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outlet</label>
              <OutletSelector />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plate Color</label>
              <Select value={plateColorFilter} onValueChange={handleFilterChange(setPlateColorFilter)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Colors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {plateColorOptions.map(([name]) => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        <PlateColorBadge color={name.toLowerCase()} />
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu, color, status..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Items', value: items.length },
            { label: 'Total Qty', value: items.reduce((s, i) => s + (i.quantity || 0), 0) },
            { label: 'Sold', value: items.filter(i => i.finalStatus === 'sold').length },
            { label: 'Waste', value: items.filter(i => i.finalStatus === 'waste').length },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {isLoading ? 'Loading...' : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {cols.map(col => (
                    <th
                      key={col.key}
                      className="text-left px-4 py-3 font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-muted transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={cols.length} className="px-4 py-12 text-center text-muted-foreground">
                      Loading data...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length} className="px-4 py-12 text-center text-muted-foreground">
                      {!selectedOutletId ? 'Select an outlet to view data.' : `No production items found for ${date}.`}
                    </td>
                  </tr>
                ) : (
                  paged.map(item => (
                    <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{item.menuName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PlateColorBadge color={item.plateColorName?.toLowerCase() || ''} />
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{formatDateTime(item.producedAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{formatDateTime(item.expiresAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BeltStatusBadge status={item.beltStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <FinalStatusBadge status={item.finalStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{formatDateTime(item.soldAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{formatDateTime(item.wastedAt)}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground text-xs" title={item.notes ?? ''}>
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!isLoading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, totalItems)} of {totalItems} items
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page number buttons with ellipsis */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={safePage === p ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(p as number)}
                        aria-label={`Page ${p}`}
                        aria-current={safePage === p ? 'page' : undefined}
                      >
                        {p}
                      </Button>
                    )
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
