import { Skeleton } from "@tablekeep/ui/components/skeleton";

export default function CampaignLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4 rounded-xl border p-4 sm:p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    </div>
  );
}
