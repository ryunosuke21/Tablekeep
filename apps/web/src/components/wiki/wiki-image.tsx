"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@tablekeep/ui/lib/utils";

import type { WikiCategory } from "@/lib/wiki/catalog";
import { wikiImageFallback, wikiImageSrc } from "@/lib/wiki/images";

/**
 * Entries whose artwork is not on disk yet, remembered for the session so a
 * missing file is only ever requested once no matter how often it scrolls by.
 */
const missing = new Set<string>();

export function WikiImage({
  category,
  name,
  className,
  imageClassName,
  eager = false,
}: {
  category: WikiCategory;
  name: string;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
}) {
  const source = wikiImageSrc(category, name);
  const fallback = wikiImageFallback(category);
  const [failed, setFailed] = useState(() => missing.has(source));
  const image = useRef<HTMLImageElement>(null);
  const src = failed ? fallback : source;

  // A record page is rendered on the server, so a 404 can land before React
  // attaches its handlers. Anything already finished loading is checked once.
  useEffect(() => {
    const node = image.current;
    if (!node?.complete || node.naturalWidth > 0) return;
    missing.add(source);
    setFailed(true);
  }, [source]);

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden bg-tk-keep",
        failed &&
          "bg-[color-mix(in_oklab,var(--wiki-accent)_16%,var(--muted))]",
        className,
      )}
    >
      {/* biome-ignore lint/performance/noImgElement: hand-added local art, resolved by naming convention with a fallback on miss. */}
      <img
        ref={image}
        src={src}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => {
          missing.add(source);
          setFailed(true);
        }}
        className={cn(
          "size-full object-cover",
          failed && "opacity-40 grayscale",
          imageClassName,
        )}
      />
    </span>
  );
}
