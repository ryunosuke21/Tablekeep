import Image from "next/image";

import { cn } from "@tablekeep/ui/lib/utils";

import { WIKI_CATEGORY_META, type WikiCategory } from "@/lib/wiki/catalog";

const positions = ["object-center", "object-left", "object-right"] as const;

function stablePosition(key: string) {
  const total = Array.from(key).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return positions[total % positions.length];
}

export function WikiArtwork({
  category,
  recordKey,
  priority = false,
  className,
}: {
  category: WikiCategory;
  recordKey?: string;
  priority?: boolean;
  className?: string;
}) {
  const meta = WIKI_CATEGORY_META[category];
  return (
    <div className={cn("relative overflow-hidden bg-tk-keep", className)}>
      <Image
        src={meta.art}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className={cn(
          "object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none",
          recordKey ? stablePosition(recordKey) : "object-center",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-tk-keep/45 via-transparent to-transparent" />
    </div>
  );
}
