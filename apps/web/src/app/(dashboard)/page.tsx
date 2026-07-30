import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { api } from "@/trpc/server";

export default async function DashboardPage() {
  const [campaigns, characters] = await Promise.all([
    api.campaign.list(),
    api.character.list(),
  ]);

  return (
    <DashboardOverview
      campaigns={[...campaigns.items]}
      characters={[...characters.items]}
    />
  );
}
