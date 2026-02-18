import { SalesInput } from "@/components/sales-input"

export const metadata = {
  title: "Sales Input - POS",
  description: "Record sales transactions from Point of Sale system",
}

export default function SalesInputPage() {
  return (
    <div className="p-6 md:p-8">
      <SalesInput />
    </div>
  )
}
