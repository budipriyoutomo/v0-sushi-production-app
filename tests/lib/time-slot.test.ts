import { describe, it, expect } from "vitest"
import {
  contrastTextColor,
  findSlotAt,
  findSlotByLabel,
  markerAt,
  minutesOfDay,
  parseClock,
  sortSlotsByTime,
} from "@/lib/time-slot"
import type { TimeMarker, TimeSlot } from "@/lib/api"

/**
 * Pemetaan waktu → slot → penanda.
 *
 * Ini berkas yang menggantikan dua perhitungan yang dulu harus selalu sepakat
 * tanpa apa pun yang menjaganya: layar planning memilih warna dari nomor urut
 * baris, sementara conveyor menghitungnya dari jam `produced_at` dengan patokan
 * 10:00 dan sisa bagi lima warna.
 */

function marker(overrides: Partial<TimeMarker> = {}): TimeMarker {
  return {
    id: "marker-1",
    brandId: "brand-1",
    label: "Biru",
    colorHex: "#3B82F6",
    sortOrder: 0,
    isActive: true,
    ...overrides,
  }
}

function slot(start: string, end: string, overrides: Partial<TimeSlot> = {}): TimeSlot {
  return {
    id: `slot-${start}`,
    brandId: "brand-1",
    startTime: `${start}:00`,
    endTime: `${end}:00`,
    label: `${start}-${end}`,
    marker: marker(),
    sortOrder: 0,
    isActive: true,
    ...overrides,
  }
}

function at(hours: number, minutes = 0): Date {
  const date = new Date(2026, 8, 24)
  date.setHours(hours, minutes, 0, 0)
  return date
}

describe("parseClock", () => {
  it("menerima HH:MM dan HH:MM:SS", () => {
    expect(parseClock("10:00")).toBe(600)
    expect(parseClock("10:30:00")).toBe(630)
    expect(parseClock("00:00")).toBe(0)
    expect(parseClock("23:59")).toBe(1439)
  })

  it("menolak yang bukan jam", () => {
    expect(parseClock("")).toBeNull()
    expect(parseClock("abc")).toBeNull()
    expect(parseClock("24:00")).toBeNull()
    expect(parseClock("10:60")).toBeNull()
  })
})

describe("minutesOfDay", () => {
  it("memakai jam lokal peramban", () => {
    expect(minutesOfDay(at(10, 15))).toBe(615)
  })
})

describe("findSlotAt", () => {
  const slots = [slot("10:00", "10:30"), slot("10:30", "11:00"), slot("14:00", "15:00")]

  it("menemukan slot yang memuat jam itu", () => {
    expect(findSlotAt(slots, at(10, 15))?.label).toBe("10:00-10:30")
    expect(findSlotAt(slots, at(14, 59))?.label).toBe("14:00-15:00")
  })

  /**
   * Batas bawah ikut, batas atas tidak. Kalau dua-duanya ikut, piring yang
   * dibuat tepat 10:30 cocok dengan dua slot sekaligus dan penandanya
   * bergantung pada baris mana yang kebetulan ditemukan duluan.
   */
  it("memasukkan batas bawah dan mengecualikan batas atas", () => {
    expect(findSlotAt(slots, at(10, 30))?.label).toBe("10:30-11:00")
    expect(findSlotAt(slots, at(10, 0))?.label).toBe("10:00-10:30")
  })

  it("mengembalikan null di luar semua slot", () => {
    expect(findSlotAt(slots, at(9, 59))).toBeNull()
    expect(findSlotAt(slots, at(11, 30))).toBeNull()
    expect(findSlotAt(slots, at(23, 0))).toBeNull()
  })

  it("melewati slot nonaktif", () => {
    const withInactive = [slot("10:00", "10:30", { isActive: false })]
    expect(findSlotAt(withInactive, at(10, 15))).toBeNull()
  })
})

describe("markerAt", () => {
  it("mengambil penanda dari slotnya", () => {
    const slots = [slot("10:00", "10:30", { marker: marker({ label: "Hijau" }) })]
    expect(markerAt(slots, at(10, 10))?.label).toBe("Hijau")
  })

  /**
   * Versi lama memakai `Math.max(0, index)`, jadi setiap piring sebelum 10:00
   * memakai warna slot pertama — penanda yang terlihat sah padahal tidak
   * menunjuk apa pun.
   */
  it("mengembalikan null sebelum slot pertama, bukan penanda pertama", () => {
    const slots = [slot("10:00", "10:30")]
    expect(markerAt(slots, at(8, 0))).toBeNull()
  })

  it("mengembalikan null kalau slotnya belum punya penanda", () => {
    const slots = [slot("10:00", "10:30", { marker: null })]
    expect(markerAt(slots, at(10, 5))).toBeNull()
  })
})

/**
 * Inti dari fase ini: layar planning mencari slot lewat LABEL, layar conveyor
 * lewat JAM. Keduanya harus menghasilkan penanda yang sama untuk slot yang
 * sama — dulu tidak, karena keduanya menghitung sendiri-sendiri.
 */
describe("planning dan conveyor sepakat", () => {
  const slots = [
    slot("10:00", "10:30", { marker: marker({ id: "m1", label: "Biru" }) }),
    slot("10:30", "11:00", { marker: marker({ id: "m2", label: "Hitam" }) }),
    slot("12:30", "13:00", { marker: marker({ id: "m1", label: "Biru" }) }),
  ]

  it.each([
    ["10:00-10:30", at(10, 5)],
    ["10:30-11:00", at(10, 45)],
    ["12:30-13:00", at(12, 59)],
  ])("penanda untuk %s sama dari kedua arah", (label, time) => {
    const fromLabel = findSlotByLabel(slots, label as string)?.marker
    const fromClock = markerAt(slots, time as Date)

    expect(fromLabel?.id).toBe(fromClock?.id)
  })

  it("label yang tidak ada di master menghasilkan null", () => {
    expect(findSlotByLabel(slots, "08:00-09:00")).toBeNull()
  })
})

describe("sortSlotsByTime", () => {
  it("mengurutkan menurut jam mulai, bukan urutan masuk", () => {
    const slots = [slot("14:00", "15:00"), slot("09:00", "09:30"), slot("11:00", "11:30")]

    expect(sortSlotsByTime(slots).map((s) => s.label)).toEqual([
      "09:00-09:30",
      "11:00-11:30",
      "14:00-15:00",
    ])
  })

  it("tidak mengubah array aslinya", () => {
    const slots = [slot("14:00", "15:00"), slot("09:00", "09:30")]
    sortSlotsByTime(slots)

    expect(slots[0].label).toBe("14:00-15:00")
  })
})

describe("contrastTextColor", () => {
  it("memilih teks gelap di atas warna terang", () => {
    expect(contrastTextColor("#FACC15")).toBe("#111827") // kuning
    expect(contrastTextColor("#FFFFFF")).toBe("#111827")
  })

  it("memilih teks terang di atas warna gelap", () => {
    expect(contrastTextColor("#1F2937")).toBe("#FFFFFF")
    expect(contrastTextColor("#000000")).toBe("#FFFFFF")
  })

  /**
   * Rata-rata RGB akan menganggap hijau murni sama gelapnya dengan biru murni.
   * Mata tidak begitu — dan badge hijau bertulisan putih sulit dibaca.
   */
  it("membedakan hijau dari biru pada kecerahan yang sama", () => {
    expect(contrastTextColor("#00FF00")).toBe("#111827")
    expect(contrastTextColor("#0000FF")).toBe("#FFFFFF")
  })

  it("menganggap nilai rusak sebagai latar terang", () => {
    expect(contrastTextColor("")).toBe("#111827")
    expect(contrastTextColor(null)).toBe("#111827")
    expect(contrastTextColor("bukan-warna")).toBe("#111827")
  })
})
