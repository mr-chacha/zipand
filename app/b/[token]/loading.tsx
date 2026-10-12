export default function BriefingLoading() {
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-xl animate-pulse overflow-hidden rounded-xl border bg-white" aria-busy="true">
        <div className="aspect-[2/1] bg-neutral-200" />
        <div className="space-y-4 p-6">
          <div className="h-4 w-24 rounded bg-neutral-200" />
          <div className="h-6 w-3/4 rounded bg-neutral-200" />
          <div className="h-8 w-1/2 rounded bg-neutral-200" />
          <div className="h-20 rounded-lg bg-neutral-100" />
        </div>
      </div>
    </main>
  );
}
