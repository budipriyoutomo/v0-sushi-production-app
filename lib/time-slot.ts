import type { TimeMarker, TimeSlot } from '@/lib/api'

/**
 * Satu-satunya tempat yang memetakan waktu ke slot, dan slot ke penanda.
 *
 * Sebelum ini ada dua perhitungan yang harus selalu sepakat tapi tidak pernah
 * dijaga: layar planning memilih warna dari NOMOR URUT BARIS, sementara
 * conveyor dan expired menghitungnya dari jam `produced_at` dengan patokan
 * 10:00 dan sisa bagi lima warna. Keduanya dikunci mati, disalin di tiga
 * berkas, dan bisa menyimpang tanpa ada yang tahu.
 *
 * Sekarang keduanya membaca baris slot yang sama dari master, jadi tidak ada
 * yang perlu disepakati — hanya ada satu jawaban.
 */

/** Menit sejak tengah malam untuk jam dinding "HH:MM" atau "HH:MM:SS". */
export function parseClock(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time?.trim() ?? '')

  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 23 || minutes > 59) return null

  return hours * 60 + minutes
}

/**
 * Menit sejak tengah malam menurut jam LOKAL peramban.
 *
 * `produced_at` dikirim backend sebagai ISO UTC dan diurai `new Date()` jadi
 * titik waktu yang benar. Jam dindingnya baru muncul di sini, dan tablet dapur
 * memakai zona waktu setempat — sama dengan jam yang diketik admin ke slot.
 */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/** Hanya slot aktif. Mematikan slot berarti "jangan dipakai lagi mulai sekarang". */
function activeSlots(slots: TimeSlot[]): TimeSlot[] {
  return slots.filter((slot) => slot.isActive !== false)
}

/**
 * Slot yang memuat jam ini.
 *
 * Batas bawah ikut, batas atas tidak (`start <= t < end`) — kalau tidak, piring
 * yang dibuat tepat pukul 10:30 akan cocok dengan dua slot sekaligus. Backend
 * sudah menolak slot yang tumpang tindih, jadi paling banyak satu yang cocok.
 */
export function findSlotAt(slots: TimeSlot[], at: Date): TimeSlot | null {
  const minute = minutesOfDay(at)

  return (
    activeSlots(slots).find((slot) => {
      const start = parseClock(slot.startTime)
      const end = parseClock(slot.endTime)

      if (start === null || end === null) return false

      return minute >= start && minute < end
    }) ?? null
  )
}

/**
 * Penanda untuk jam ini, atau `null` kalau jamnya di luar semua slot.
 *
 * `null` sengaja TIDAK dijatuhkan ke penanda pertama. Versi lama memakai
 * `Math.max(0, index)`, jadi setiap piring sebelum jam 10:00 memakai warna slot
 * pertama — penanda yang terlihat sah padahal tidak berarti apa-apa. Layar
 * harus menampilkan ketiadaannya, bukan menyembunyikannya.
 */
export function markerAt(slots: TimeSlot[], at: Date): TimeMarker | null {
  return findSlotAt(slots, at)?.marker ?? null
}

/**
 * Slot dengan label ini.
 *
 * Dipakai layar planning: baris plan tersimpan membawa label teks, dan label
 * yang slotnya sudah tidak ada di master adalah keadaan yang sah — mengubah jam
 * slot tidak boleh mengubah plan yang sudah tersimpan. Pemanggil menampilkan
 * `null` sebagai "slot tidak dikenal".
 */
export function findSlotByLabel(slots: TimeSlot[], label: string): TimeSlot | null {
  return slots.find((slot) => slot.label === label) ?? null
}

/** Slot terurut jam. Backend sudah mengurutkannya; ini untuk daftar rakitan sendiri. */
export function sortSlotsByTime(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort(
    (a, b) => (parseClock(a.startTime) ?? 0) - (parseClock(b.startTime) ?? 0)
  )
}

/**
 * Warna teks yang terbaca di atas sebuah warna latar.
 *
 * Admin boleh memilih hex apa pun, jadi warna teksnya tidak boleh ikut dipilih
 * — dua nilai yang menggambarkan hal sama akan menyimpang, dan yang muncul
 * adalah badge kuning bertulisan putih. Dihitung dari luminansi relatif (WCAG),
 * bukan sekadar rata-rata RGB: mata jauh lebih peka ke hijau daripada biru.
 *
 * Hex yang tidak bisa diurai dianggap latar terang — teks gelap masih terbaca
 * di atas kotak kosong, sebaliknya tidak.
 */
export function contrastTextColor(colorHex: string | null | undefined): string {
  const DARK = '#111827'
  const LIGHT = '#FFFFFF'

  const match = /^#?([0-9a-f]{6})$/i.exec(colorHex?.trim() ?? '')

  if (!match) return DARK

  const value = parseInt(match[1], 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]

  const [r, g, b] = channels.map((channel) => {
    const srgb = channel / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
  })

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

  // 0.179 adalah titik tempat kontras terhadap hitam dan terhadap putih sama
  // besar menurut rumus WCAG.
  return luminance > 0.179 ? DARK : LIGHT
}
