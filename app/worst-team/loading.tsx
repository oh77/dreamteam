function SkeletonRow({ count }: { count: number }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton index is stable
        <div key={i} className="h-20 w-20 sm:w-24 rounded-xl skeleton" />
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 text-center space-y-3">
        <div className="skeleton h-10 w-72 rounded-xl mx-auto" />
        <div className="skeleton h-4 w-48 rounded mx-auto" />
        <div className="skeleton h-8 w-32 rounded-full mx-auto" />
      </div>

      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{ minHeight: "520px", background: "#1a0c0c" }}
      >
        <div className="flex flex-col-reverse items-center gap-6 sm:gap-8 px-4 py-8">
          <SkeletonRow count={1} />
          <SkeletonRow count={3} />
          <SkeletonRow count={4} />
          <SkeletonRow count={3} />
        </div>
      </div>
    </div>
  );
}
