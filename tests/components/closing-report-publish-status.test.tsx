import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ClosingReportPublishStatus } from "@/components/closing-report-publish-status"

/**
 * Status kirim closing report ke BI, dilihat operator setelah submit.
 *
 * Operator tidak bisa berbuat apa-apa atas broker yang mati — server mencoba
 * ulang sendiri. Jadi `failed` tidak boleh terdengar seperti submit gagal:
 * laporannya sudah tersimpan, yang tertunda hanya kirimannya.
 */
describe("ClosingReportPublishStatus", () => {
  it("menyatakan terkirim kalau published", () => {
    render(<ClosingReportPublishStatus status="published" />)

    expect(screen.getByText("Terkirim ke BI")).toBeInTheDocument()
  })

  it.each(["pending", "failed"] as const)("menyatakan menunggu kirim ulang otomatis kalau %s", (status) => {
    render(<ClosingReportPublishStatus status={status} />)

    expect(screen.getByText("Menunggu dikirim ke BI")).toBeInTheDocument()
    expect(screen.getByText(/dicoba ulang otomatis/i)).toBeInTheDocument()
    expect(screen.queryByText(/gagal/i)).not.toBeInTheDocument()
  })

  it.each([null, undefined])("tidak menampilkan apa pun kalau status %s", (status) => {
    const { container } = render(<ClosingReportPublishStatus status={status} />)

    expect(container).toBeEmptyDOMElement()
  })
})
