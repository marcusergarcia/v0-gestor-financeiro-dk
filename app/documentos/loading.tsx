export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-48 h-10 bg-gray-200 rounded"></div>
            <div className="w-48 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="grid grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="grid grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
