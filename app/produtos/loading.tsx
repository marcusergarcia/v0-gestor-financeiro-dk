import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProdutosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-9 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-4" />
          <div className="h-10 bg-gray-200 rounded w-80 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/8 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/8 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
