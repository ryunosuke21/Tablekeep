import { Skeleton } from "@tablekeep/ui/components/skeleton";

export default function JoinLoading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-sm" />
      <Skeleton className="mt-8 h-48 w-full rounded-xl" />
    </main>
  );
}
