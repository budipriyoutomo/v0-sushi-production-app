import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  selectedOutletId: "outlet-1",
  analysis: null as unknown,
  isLoading: false,
  toast: vi.fn(),
}))

vi.mock("@/hooks/use-reports", () => ({
  useWasteAnalysis: () => ({ analysis: mocks.analysis, isLoading: mocks.isLoading, refresh: vi.fn() }),
}))
vi.mock("@/lib/outlet-context", () => ({ useOutlet: () => ({ selectedOutletId: mocks.selectedOutletId }) }))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))
vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))
// Stub recharts (needs real layout that jsdom lacks).
vi.mock("recharts", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const Empty = () => null
  return {
    ResponsiveContainer: Passthrough,
    BarChart: Passthrough,
    PieChart: Passthrough,
    Bar: Empty, Pie: Empty, Cell: Empty,
    XAxis: Empty, YAxis: Empty, CartesianGrid: Empty, Tooltip: Empty,
  }
})

import WasteAnalysisPage from "@/app/report/waste-analysis/page"

const fixture = {
  period: { startDate: "2026-06-01", endDate: "2026-06-17" },
  totalWaste: 5,
  totalProduction: 40,
  wastePercentage: 12.5,
  wasteCost: 70000,
  topReason: "Damaged",
  byPlateColor: [
    { plateColorId: "c1", plateColorName: "Merah", wasteCount: 3, productionCount: 30, wastePercentage: 10 },
  ],
  byReason: [
    { reason: "Damaged", count: 3, percentage: 60 },
    { reason: "Expiration", count: 2, percentage: 40 },
  ],
  byDay: [{ date: "2026-06-10", quantity: 3 }],
}

describe("WasteAnalysisPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.selectedOutletId = "outlet-1"
    mocks.analysis = null
    mocks.isLoading = false
  })

  it("shows a placeholder before fetching", () => {
    render(<WasteAnalysisPage />)
    expect(screen.getByText(/click .*Fetch Data/i)).toBeInTheDocument()
  })

  it("disables the Fetch button when no outlet is selected", () => {
    mocks.selectedOutletId = ""
    render(<WasteAnalysisPage />)

    expect(screen.getByRole("button", { name: /fetch data/i })).toBeDisabled()
  })

  it("renders analysis stats and recommendations after fetching", async () => {
    mocks.analysis = fixture
    const user = userEvent.setup()
    render(<WasteAnalysisPage />)

    await user.click(screen.getByRole("button", { name: /fetch data/i }))

    // Waste rate + top reason from the real backend-shaped payload
    expect(screen.getByText("12.5%")).toBeInTheDocument()
    expect(screen.getAllByText("Damaged").length).toBeGreaterThan(0)
    // Cost formatted as Rupiah
    expect(screen.getByText(/70\.000/)).toBeInTheDocument()
    // Dynamic recommendation references the leading cause
    expect(screen.getByText(/reducing "Damaged" waste/i)).toBeInTheDocument()
    // Waste-by-reason detail rows
    expect(screen.getByText("Expiration")).toBeInTheDocument()
    expect(screen.getByText("3 items")).toBeInTheDocument()
  })
})
