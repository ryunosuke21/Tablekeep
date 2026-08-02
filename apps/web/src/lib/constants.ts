export const APP_NAME = "Tablekeep";
export const APP_SLOGAN = "The best way to keep your tables";

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
