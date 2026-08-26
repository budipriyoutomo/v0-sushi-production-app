import { afterEach, beforeEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

/**
 * Radix membuka dropdown-nya lewat Pointer Events API, dan jsdom tidak
 * mengimplementasikannya sama sekali. Tanpa penambal ini `SelectTrigger` yang
 * diklik tidak pernah membuka daftarnya — yang terlihat di test cuma
 * "Unable to find role=option", seolah opsinya tidak pernah dirender.
 *
 * `scrollIntoView` dipanggil Radix saat memberi fokus ke item terpilih, dan
 * jsdom juga tidak punya itu.
 *
 * Ditambal di sini, bukan per test: setiap layar yang memakai `<Select>` butuh
 * penambal yang sama persis, dan menyalinnya per berkas berarti berkas
 * berikutnya melewatkannya lalu terlihat seperti bug komponen.
 */
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
}

// Ensure each test starts from a clean browser storage state.
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
