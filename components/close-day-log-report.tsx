'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutletSelector } from '@/components/outlet-selector'
import { useOutlet } from '@/lib/outlet-context'
import { useCloseDayLogs } from '@/hooks/use-reports'
import { useToast } from '@/hooks/use-toast'
import type { CloseDayLog, CloseDayLogAction, CloseDayLogParams, CloseDayLogTrigger } from '@/lib/api'

const ACTION_LABEL: Record<CloseDayLogAction, string> = {
  close_day: 'Close Day → sold',
  auto_waste: 'Auto-waste → waste',
}

const TRIGGER_LABEL: Record<CloseDayLogTrigger, string> = {
  button: 'Conveyor button',
  scheduler: 'Midnight scheduler',
  command: 'Manual artisan',
  get_data_pos: 'Get Data POS',
}

/** Tanggal lokal (Y-m-d). `toISOString()` memakai UTC dan menggeser hari sebelum 07:00 WIB. */
function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function firstOfMonth(): string {
  const d = new Date()
  return localDate(new Date(d.getFullYear(), d.getMonth(), 1))
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID')
}

function executedBy(log: CloseDayLog): string {
  if (log.executedByName) return log.executedByName
  if (log.executedBy) return `User #${log.executedBy}`
  return 'System'
}

export function CloseDayLogReport() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(() => localDate(new Date()))
  const [action, setAction] = useState<CloseDayLogAction | ''>('')
  const [query, setQuery] = useState<CloseDayLogParams | null>(null)

  const { logs, total, page, lastPage, isLoading } = useCloseDayLogs(query)

  const handleFetch = () => {
    if (!selectedOutletId) {
      toast({ title: 'Error', description: 'Please select an outlet first', variant: 'destructive' })
      return
    }
    setQuery({
      outletId: selectedOutletId,
      startDate,
      endDate,
      ...(action ? { action } : {}),
      page: 1,
    })
  }

  const goToPage = (next: number) => {
    if (query) setQuery({ ...query, page: next })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Close Day Log</h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of every Close Day on the conveyor and every midnight auto-waste
          </p>
        </div>
        <OutletSelector />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="cdl-start" className="text-xs font-medium text-muted-foreground">Start Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input id="cdl-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 w-[160px]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cdl-end" className="text-xs font-medium text-muted-foreground">End Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input id="cdl-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-[160px]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cdl-action" className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                id="cdl-action"
                value={action}
                onChange={(e) => setAction(e.target.value as CloseDayLogAction | '')}
                className="h-10 w-[200px] rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All</option>
                <option value="close_day">{ACTION_LABEL.close_day}</option>
                <option value="auto_waste">{ACTION_LABEL.auto_waste}</option>
              </select>
            </div>
            <Button onClick={handleFetch} disabled={isLoading || !selectedOutletId} className="h-10 px-5">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Fetch Data</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!query ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select an outlet and date range, then click “Fetch Data”.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">No close-day activity for this period.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{total} entries</CardTitle>
            <p className="text-sm text-muted-foreground">
              Filtered by production date. Auto-waste means plates were left unfinished on that day.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Executed At</TableHead>
                    <TableHead>Production Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead className="text-right">Plates</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(log.executedAt)}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{log.businessDate ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={
                            log.action === 'auto_waste'
                              ? 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
                              : 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                          }
                        >
                          {ACTION_LABEL[log.action] ?? log.action}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{TRIGGER_LABEL[log.trigger] ?? log.trigger}</TableCell>
                      <TableCell className="text-right tabular-nums">{log.closedCount}</TableCell>
                      <TableCell className="whitespace-nowrap">{executedBy(log)}</TableCell>
                      <TableCell className="max-w-[240px]">
                        {log.ipAddress || log.userAgent ? (
                          <div className="text-xs text-muted-foreground truncate" title={log.userAgent ?? undefined}>
                            {log.ipAddress ?? '—'}
                            {log.userAgent ? ` · ${log.userAgent}` : ''}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Page {page} of {lastPage}
                </span>
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= lastPage}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
