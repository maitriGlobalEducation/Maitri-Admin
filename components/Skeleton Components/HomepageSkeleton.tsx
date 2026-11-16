const sections = [1, 2, 3, 4, 5, 6];

export default function HomepageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-md bg-zinc-200" />
        <div className="h-4 w-80 rounded-md bg-zinc-100" />
      </div>

      {/* Section cards */}
      <div className="space-y-4">
        {sections.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-lg bg-zinc-200" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-zinc-200" />
                <div className="h-3 w-56 rounded bg-zinc-100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <div className="h-11 w-36 rounded-lg bg-zinc-200" />
      </div>
    </div>
  );
}
