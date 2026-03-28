export default function DashboardLoading() {
  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-24 h-6 bg-gray-200 rounded animate-pulse flex-1" />
        <div className="w-20 h-8 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Earnings summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-10 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse mb-4 flex items-center justify-center text-gray-400 text-sm">
        Loading map...
      </div>

      {/* History */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </main>
  );
}
