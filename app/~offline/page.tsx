export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Sedang offline</h1>
        <p className="text-sm text-muted-foreground">
          Koneksi internet terputus. Beberapa halaman yang sudah pernah dibuka mungkin masih bisa diakses.
        </p>
      </div>
    </main>
  )
}
