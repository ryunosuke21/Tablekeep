import { Skeleton } from "@tablekeep/ui/components/skeleton";

export default function WikiLoading() {
  return (
    <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 pb-16 sm:px-6 lg:px-10">
      <div className="pt-6 pb-4 sm:pt-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-10 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="mt-4 space-y-2 rounded-xl border bg-card p-4">
        {Array.from({ length: 10 }, (_, index) => index).map((index) => (
          <div key={index} className="space-y-1.5 py-1.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    </main>
  );
}
