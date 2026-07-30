import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { api } from "@/trpc/server";

export default async function Home() {
  const [campaigns, characters] = await Promise.all([
    api.campaign.listMine(),
    api.character.listMine(),
  ]);

  return (
    <DashboardShell
      campaigns={[...campaigns.items]}
      characters={[...characters.items]}
    />
  );
}
