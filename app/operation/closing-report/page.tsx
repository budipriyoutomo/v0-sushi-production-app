import { ClosingReport } from "@/components/closing-report"

export const metadata = {
  title: "Daily Closing Report",
  description: "Complete the daily closing report for operations",
}

export default function ClosingReportPage() {
  return (
    <div className="p-6 md:p-8">
      <ClosingReport />
    </div>
  )
}
