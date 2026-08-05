"use client";

import { useState } from "react";
import {
  IconArrowRight,
  IconCheck,
  IconFlag3,
  IconPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tablekeep/ui/components/dialog";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@tablekeep/ui/components/sidebar";
import { cn } from "@tablekeep/ui/lib/utils";

type CreationType = "campaign" | "character";

const choices = [
  {
    value: "campaign" as const,
    title: "Campaign",
    description: "Create a shared home for your table, schedule, and party.",
    href: "/campaigns/new",
  },
  {
    value: "character" as const,
    title: "Character",
    description: "Build a character sheet to use at the table.",
    href: "/characters/new",
  },
];

function CampaignPreview() {
  return (
    <div className="relative h-full overflow-hidden bg-muted">
      <Image
        src="/party.jpg"
        alt="A fantasy adventuring party"
        fill
        sizes="(max-width: 640px) calc(100vw - 4rem), 304px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
    </div>
  );
}

function CharacterPreview() {
  return (
    <div className="relative h-full overflow-hidden bg-muted">
      <Image
        src="/character.jpg"
        alt="A fantasy character"
        fill
        sizes="(max-width: 640px) calc(100vw - 4rem), 304px"
        className="object-cover object-[55%_28%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
    </div>
  );
}

export function CreateNewDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CreationType>("campaign");
  const choice = choices.find((item) => item.value === selected);

  function continueToCreator() {
    if (!choice) return;
    setOpen(false);
    router.push(choice.href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarGroup className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Create new"
              className="h-10 bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground active:bg-sidebar-primary/85 active:text-sidebar-primary-foreground group-data-[collapsible=icon]:p-2!"
            >
              <DialogTrigger>
                <IconPlus />
                <span>Create new</span>
              </DialogTrigger>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle>Create something new</DialogTitle>
          <DialogDescription>Choose what you want to create.</DialogDescription>
        </DialogHeader>

        <div
          role="radiogroup"
          aria-label="What to create"
          className="grid gap-4 p-5 sm:grid-cols-2"
        >
          {choices.map((item) => {
            const isSelected = item.value === selected;
            return (
              <label
                key={item.value}
                className="group cursor-pointer text-left outline-none"
              >
                <input
                  type="radio"
                  name="creation-type"
                  value={item.value}
                  checked={isSelected}
                  className="peer sr-only"
                  onChange={() => setSelected(item.value)}
                />
                <div
                  className={cn(
                    "relative aspect-[16/9] overflow-hidden rounded-xl border-2 bg-muted transition-[border-color,box-shadow,transform] group-hover:-translate-y-0.5 group-hover:shadow-md peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 motion-reduce:transform-none",
                    isSelected ? "border-primary shadow-sm" : "border-border",
                  )}
                >
                  {item.value === "campaign" ? (
                    <CampaignPreview />
                  ) : (
                    <CharacterPreview />
                  )}
                  <span
                    className={cn(
                      "absolute top-3 right-3 grid size-6 place-items-center rounded-full border bg-background shadow-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/20 text-transparent",
                    )}
                  >
                    <IconCheck className="size-3.5" />
                  </span>
                </div>

                <div className="mt-3 flex gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    {item.value === "campaign" ? (
                      <IconFlag3 className="size-4" />
                    ) : (
                      <IconUsersGroup className="size-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="mt-1 text-muted-foreground text-sm leading-5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <DialogFooter className="m-0 rounded-none px-5 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={continueToCreator}>
            Next
            <IconArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
