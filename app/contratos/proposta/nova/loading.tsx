export default function NovaPropostaContratoLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente Card */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"></div>
              <div className="p-6 space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Equipamentos Card */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-t-lg"></div>
              <div className="p-6 space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="border rounded-lg p-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Condições Card */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-lg"></div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg sticky top-6">
              <div className="h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-t-lg"></div>
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
