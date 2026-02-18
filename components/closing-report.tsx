'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, FileText, AlertCircle } from 'lucide-react'

interface ClosingData {
  date: string
  openingCash: number
  closingCash: number
  totalSales: number
  totalExpenses: number
  discrepancy: number
  notes: string
  signedBy: string
  timestamp: Date
  status: 'draft' | 'submitted' | 'verified'
}

export function ClosingReport() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [closingData, setClosingData] = useState<ClosingData>({
    date: new Date().toISOString().split('T')[0],
    openingCash: 0,
    closingCash: 0,
    totalSales: 2500000,
    totalExpenses: 750000,
    discrepancy: 0,
    notes: '',
    signedBy: '',
    timestamp: new Date(),
    status: 'draft',
  })

  const handleInputChange = (field: keyof ClosingData, value: any) => {
    setClosingData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const calculateDiscrepancy = () => {
    const expected = closingData.openingCash + closingData.totalSales - closingData.totalExpenses
    const discrepancy = closingData.closingCash - expected
    setClosingData((prev) => ({
      ...prev,
      discrepancy,
    }))
  }

  const handleSubmit = async () => {
    if (!closingData.signedBy) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    setTimeout(() => {
      setClosingData((prev) => ({
        ...prev,
        status: 'submitted',
      }))
      setIsSubmitting(false)
      toast({
        title: 'Success',
        description: 'Closing report submitted successfully',
      })
    }, 1000)
  }

  const expectedClosing = closingData.openingCash + closingData.totalSales - closingData.totalExpenses
  const hasDiscrepancy = Math.abs(closingData.discrepancy) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Daily Closing Report</h1>
        <p className="text-muted-foreground mt-1">Complete the daily closing report for operations team</p>
      </div>

      {/* Status Banner */}
      {closingData.status === 'submitted' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Report Submitted</p>
              <p className="text-sm text-green-700">This closing report has been submitted for verification</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Alert */}
      {hasDiscrepancy && closingData.status !== 'submitted' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Cash Discrepancy Detected</p>
              <p className="text-sm text-amber-700">
                Difference: IDR {Math.abs(closingData.discrepancy).toLocaleString('id-ID')} ({closingData.discrepancy > 0 ? 'Over' : 'Under'})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>Closing Summary</CardTitle>
          <CardDescription>Enter all closing information for {closingData.date}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Section */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={closingData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              disabled={closingData.status === 'submitted'}
            />
          </div>

          {/* Cash Flow Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Cash Position
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Opening Cash (IDR)</Label>
                  <Input
                    id="opening"
                    type="number"
                    value={closingData.openingCash || ''}
                    onChange={(e) => handleInputChange('openingCash', parseInt(e.target.value) || 0)}
                    disabled={closingData.status === 'submitted'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing">Closing Cash (IDR)</Label>
                  <Input
                    id="closing"
                    type="number"
                    value={closingData.closingCash || ''}
                    onChange={(e) => handleInputChange('closingCash', parseInt(e.target.value) || 0)}
                    disabled={closingData.status === 'submitted'}
                  />
                  {closingData.status !== 'submitted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={calculateDiscrepancy}
                      className="w-full mt-2"
                    >
                      Calculate Discrepancy
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Financial Summary
              </h3>
              <div className="space-y-4 bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Sales:</span>
                  <span className="font-semibold">IDR {closingData.totalSales.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Expenses:</span>
                  <span className="font-semibold">IDR {closingData.totalExpenses.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Expected Closing:</span>
                  <span>IDR {expectedClosing.toLocaleString('id-ID')}</span>
                </div>
                <div
                  className={`pt-2 flex justify-between font-bold ${
                    hasDiscrepancy ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  <span>Discrepancy:</span>
                  <span>{closingData.discrepancy > 0 ? '+' : ''}IDR {closingData.discrepancy.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Observations</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes, discrepancies, or observations from the closing process"
              value={closingData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={closingData.status === 'submitted'}
              rows={4}
            />
          </div>

          {/* Signature Section */}
          <div className="space-y-2">
            <Label htmlFor="signedBy">Signed By (Name & Title)</Label>
            <Input
              id="signedBy"
              placeholder="e.g., John Doe - Operations Manager"
              value={closingData.signedBy}
              onChange={(e) => handleInputChange('signedBy', e.target.value)}
              disabled={closingData.status === 'submitted'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Save as Draft</Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || closingData.status === 'submitted'}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Closing Report'}
        </Button>
      </div>
    </div>
  )
}
