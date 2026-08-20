"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Backs the play menu with the URL so the browser Back button walks through
 * sections and sub-views instead of dropping the player straight out of the
 * table. `section` is the top-level menu entry; `view` is an optional sub-view
 * (a full sheet, a manager); `member` is the party sheet the DM is inspecting.
 * Each setter pushes a history entry, so Back returns to the previous state and
 * only leaves the table once the stack is empty.
 */
export function usePlayNav<Section extends string>({
  sections,
  defaultSection,
}: {
  sections: readonly Section[];
  defaultSection: Section;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const rawSection = params.get("section");
  const section = sections.includes(rawSection as Section)
    ? (rawSection as Section)
    : defaultSection;
  const view = params.get("view");
  const member = params.get("member");

  const buildHref = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null) sp.delete(key);
        else sp.set(key, value);
      }
      const query = sp.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [params, pathname],
  );

  const setSection = useCallback(
    (value: Section) => {
      // A new section starts clean: drop any open sub-view or inspected member.
      router.push(buildHref({ section: value, view: null, member: null }));
    },
    [router, buildHref],
  );

  const setView = useCallback(
    (value: string | null) => {
      router.push(buildHref({ view: value }));
    },
    [router, buildHref],
  );

  const setMember = useCallback(
    (value: string | null) => {
      router.push(buildHref({ member: value }));
    },
    [router, buildHref],
  );

  return { section, view, member, setSection, setView, setMember };
}
