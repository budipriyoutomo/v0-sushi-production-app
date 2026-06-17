import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the axios client so BaseService can be tested in isolation, without the
// real interceptors / offline-queue dependencies. vi.hoisted lets the mock object
// exist before vi.mock (which is hoisted to the top of the file) references it.
const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

vi.mock("@/lib/api/client", () => ({
  default: mockClient,
}))

import { BaseService } from "@/lib/api/base-service"

interface Widget {
  id: string
  name: string
}

describe("BaseService", () => {
  let service: BaseService<Widget>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new BaseService<Widget>("/widgets")
  })

  it("getAll requests the endpoint with params and unwraps data", async () => {
    mockClient.get.mockResolvedValue({ data: { data: [{ id: "1", name: "A" }] } })

    const result = await service.getAll({ search: "a" })

    expect(mockClient.get).toHaveBeenCalledWith("/widgets", { params: { search: "a" } })
    expect(result.data).toEqual([{ id: "1", name: "A" }])
  })

  it("getById requests the item URL", async () => {
    mockClient.get.mockResolvedValue({ data: { data: { id: "7", name: "G" } } })

    const result = await service.getById("7")

    expect(mockClient.get).toHaveBeenCalledWith("/widgets/7")
    expect(result.data).toEqual({ id: "7", name: "G" })
  })

  it("create posts the payload to the endpoint", async () => {
    mockClient.post.mockResolvedValue({ data: { data: { id: "1", name: "New" } } })

    const result = await service.create({ name: "New" })

    expect(mockClient.post).toHaveBeenCalledWith("/widgets", { name: "New" })
    expect(result.data).toEqual({ id: "1", name: "New" })
  })

  it("update puts the payload to the item URL", async () => {
    mockClient.put.mockResolvedValue({ data: { data: { id: "1", name: "Updated" } } })

    const result = await service.update("1", { name: "Updated" })

    expect(mockClient.put).toHaveBeenCalledWith("/widgets/1", { name: "Updated" })
    expect(result.data).toEqual({ id: "1", name: "Updated" })
  })

  it("delete calls the item URL", async () => {
    mockClient.delete.mockResolvedValue({ data: { data: undefined } })

    await service.delete("1")

    expect(mockClient.delete).toHaveBeenCalledWith("/widgets/1")
  })

  it("propagates rejected requests", async () => {
    mockClient.get.mockRejectedValue(new Error("network"))

    await expect(service.getAll()).rejects.toThrow("network")
  })
})
