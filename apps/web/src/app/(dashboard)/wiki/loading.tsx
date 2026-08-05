import { Skeleton } from "@tablekeep/ui/components/skeleton";

export default function WikiLoading() {
  return (
    <main className="mx-auto w-full max-w-[92rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-4 h-10 w-56" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <Skeleton className="mt-8 h-20 w-full rounded-2xl" />
      <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {["one", "two", "three", "four", "five", "six"].map((key) => (
          <Skeleton key={key} className="h-[21rem] rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
