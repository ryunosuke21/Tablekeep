import { Skeleton } from "@tablekeep/ui/components/skeleton";

export default function CampaignsLoading() {
  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-56" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
