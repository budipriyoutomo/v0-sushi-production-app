import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  selectedOutletId: "outlet-1",
  logs: [] as unknown[],
  total: 0,
  page: 1,
  lastPage: 1,
  isLoading: false,
  lastParams: undefined as unknown,
  toast: vi.fn(),
}))

vi.mock("@/hooks/use-reports", () => ({
  useCloseDayLogs: (params: unknown) => {
    mocks.lastParams = params
    return {
      logs: params ? mocks.logs : [],
      total: mocks.total,
      page: mocks.page,
      lastPage: mocks.lastPage,
      isLoading: mocks.isLoading,
      refresh: vi.fn(),
    }
  },
}))
vi.mock("@/lib/outlet-context", () => ({ useOutlet: () => ({ selectedOutletId: mocks.selectedOutletId }) }))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))
vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))

import CloseDayLogsPage from "@/app/report/close-day-logs/page"

const closeDay = {
  id: "l1",
  outletId: "outlet-1",
  outletCode: "BDG",
  outletName: "Bandung",
  action: "close_day",
  trigger: "button",
  businessDate: "2026-11-03",
  closedCount: 42,
  executedAt: "2026-11-03T22:05:00+07:00",
  clientRequestId: "req-1",
  ipAddress: "10.0.0.5",
  userAgent: "TabletDapur/1.0",
  executedBy: "12",
  executedByName: "Kitchen BDG",
}

const autoWaste = {
  ...closeDay,
  id: "l2",
  action: "auto_waste",
  trigger: "scheduler",
  businessDate: "2026-11-02",
  closedCount: 7,
  executedAt: "2026-11-03T00:05:00+07:00",
  clientRequestId: null,
  ipAddress: null,
  userAgent: null,
  executedBy: null,
  executedByName: null,
}

describe("CloseDayLogsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.selectedOutletId = "outlet-1"
    mocks.logs = []
    mocks.total = 0
    mocks.page = 1
    mocks.lastPage = 1
    mocks.isLoading = false
    mocks.lastParams = undefined
  })

  it("does not fetch before the user asks", () => {
    render(<CloseDayLogsPage />)

    expect(mocks.lastParams).toBeNull()
    expect(screen.getByText(/click .*Fetch Data/i)).toBeInTheDocument()
  })

  it("disables Fetch when no outlet is selected", () => {
    mocks.selectedOutletId = ""
    render(<CloseDayLogsPage />)

    expect(screen.getByRole("button", { name: /fetch data/i })).toBeDisabled()
  })

  it("lists close-day and auto-waste runs after fetching", async () => {
    mocks.logs = [closeDay, autoWaste]
    mocks.total = 2
    const user = userEvent.setup()
    render(<CloseDayLogsPage />)

    await user.click(screen.getByRole("button", { name: /fetch data/i }))

    expect(screen.getByText("2 entries")).toBeInTheDocument()
    expect(screen.getAllByText("Close Day → sold").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Auto-waste → waste").length).toBeGreaterThan(0)
    expect(screen.getByText("Conveyor button")).toBeInTheDocument()
    expect(screen.getByText("Midnight scheduler")).toBeInTheDocument()
    expect(screen.getByText("Kitchen BDG")).toBeInTheDocument()
    // Auto-waste dari scheduler tidak punya user login.
    expect(screen.getByText("System")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("sends the outlet, range and type filter to the hook", async () => {
    const user = userEvent.setup()
    render(<CloseDayLogsPage />)

    await user.selectOptions(screen.getByLabelText("Type"), "auto_waste")
    await user.click(screen.getByRole("button", { name: /fetch data/i }))

    expect(mocks.lastParams).toMatchObject({ outletId: "outlet-1", action: "auto_waste", page: 1 })
  })

  it("pages through results", async () => {
    mocks.logs = [closeDay]
    mocks.total = 30
    mocks.lastPage = 2
    const user = userEvent.setup()
    render(<CloseDayLogsPage />)

    await user.click(screen.getByRole("button", { name: /fetch data/i }))
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /next/i }))

    expect(mocks.lastParams).toMatchObject({ page: 2 })
  })

  it("shows an empty state when nothing was closed in the period", async () => {
    const user = userEvent.setup()
    render(<CloseDayLogsPage />)

    await user.click(screen.getByRole("button", { name: /fetch data/i }))

    expect(screen.getByText(/no close-day activity/i)).toBeInTheDocument()
  })
})
