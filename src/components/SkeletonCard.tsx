export default function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-pulse">
      <div className="aspect-[3/2] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  )
}
