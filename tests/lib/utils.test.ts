import { describe, it, expect } from "vitest"
import { cn, formatRupiah, capitalize, lowercase, formatMinutes } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b")
  })
})

describe("formatRupiah", () => {
  it("formats a number as IDR currency", () => {
    // Intl uses a non-breaking space between symbol and amount.
    const result = formatRupiah(15000)
    expect(result).toContain("Rp")
    expect(result).toContain("15.000")
  })

  it("treats undefined as zero", () => {
    expect(formatRupiah()).toContain("0")
  })
})

describe("capitalize", () => {
  it("uppercases the first character", () => {
    expect(capitalize("bandung")).toBe("Bandung")
  })

  it("returns empty string for undefined", () => {
    expect(capitalize()).toBe("")
  })

  it("leaves an already-capitalized word unchanged", () => {
    expect(capitalize("Merah")).toBe("Merah")
  })
})

describe("lowercase", () => {
  it("lowercases the text", () => {
    expect(lowercase("MERAH")).toBe("merah")
  })

  it("returns empty string for undefined", () => {
    expect(lowercase()).toBe("")
  })
})

describe("formatMinutes", () => {
  it("appends the min suffix", () => {
    expect(formatMinutes(45)).toBe("45 min")
  })

  it("treats undefined as zero", () => {
    expect(formatMinutes()).toBe("0 min")
  })
})
