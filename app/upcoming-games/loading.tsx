export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>

      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, g) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton index is stable
          <div key={g}>
            <div className="skeleton h-3 w-40 rounded mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton index is stable
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
