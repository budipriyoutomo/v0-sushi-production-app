export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-semibold tracking-normal">Offline mode</h1>
        <p className="text-sm text-muted-foreground">
          The app shell is available, but live production data needs the kitchen network. Pending changes will retry when the connection returns.
        </p>
      </section>
    </main>
  )
}
