export const MAX_FILE_SIZE = "4MB" as const;

const FILE_SIZE_PATTERN = /^(\d+(?:\.\d+)?)(B|KB|MB|GB)$/;
const FILE_SIZE_MULTIPLIERS = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
} as const;

function fileSizeToBytes(fileSize: string): number {
  const match = FILE_SIZE_PATTERN.exec(fileSize);
  const amount = match?.[1];
  const unit = match?.[2] as keyof typeof FILE_SIZE_MULTIPLIERS | undefined;

  if (!amount || !unit) {
    throw new Error(`Invalid file size: ${fileSize}`);
  }

  return Number(amount) * FILE_SIZE_MULTIPLIERS[unit];
}

export const MAX_FILE_SIZE_BYTES = fileSizeToBytes(MAX_FILE_SIZE);

/** Closed-beta guardrails for campaign-owned data. */
export const MAX_ACTIVE_CAMPAIGNS_PER_USER = 10;
export const MAX_CAMPAIGN_MEMBERS = 12;
export const MAX_PENDING_CAMPAIGN_INVITATIONS = 20;
export const CAMPAIGN_INVITE_TTL_DAYS = 14;
export const CAMPAIGN_INVITE_TTL_SECONDS =
  CAMPAIGN_INVITE_TTL_DAYS * 24 * 60 * 60;
export const CAMPAIGN_SCHEDULE_HORIZON_DAYS = 90;

/** A second safety bound in addition to the date horizon. */
export const MAX_CAMPAIGN_SCHEDULE_OCCURRENCES = 256;
