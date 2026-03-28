export default function ObserveLoading() {
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* GPS status */}
      <div className="h-10 bg-gray-100 rounded-xl animate-pulse mb-4" />

      {/* Condition grid */}
      <div className="mb-4">
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="mb-4">
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Feel */}
      <div className="mb-6">
        <div className="w-28 h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
    </main>
  );
}
