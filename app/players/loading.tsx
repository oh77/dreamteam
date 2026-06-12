const FILTER_SLOTS = [1, 2, 3, 4, 5];
const ROW_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-4 w-36 rounded" />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTER_SLOTS.map((n) => (
          <div key={n} className="skeleton h-8 w-14 rounded-full" />
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden ring-1 ring-white/10">
        <div className="skeleton h-10 w-full" />
        {ROW_SLOTS.map((n) => (
          <div
            key={n}
            className="skeleton h-12 w-full mt-px"
            style={{ opacity: 1 - (n - 1) * 0.04 }}
          />
        ))}
      </div>
    </div>
  );
}
