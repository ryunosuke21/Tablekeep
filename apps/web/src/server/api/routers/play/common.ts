import type { campaigns } from "@/server/db/schema";

type PlayCampaign = typeof campaigns.$inferSelect;

export function playCampaignSummary(campaign: PlayCampaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    colors: campaign.colors,
    logo: campaign.logo,
    bannerImage: campaign.bannerImage,
    status: campaign.status,
  };
}
