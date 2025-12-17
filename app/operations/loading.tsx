import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Skeleton className="h-10 w-3/4 mx-auto mb-6" />
      <Skeleton className="h-6 w-1/2 mx-auto mb-8" />

      <Skeleton className="h-12 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div>
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    </div>
  )
}

