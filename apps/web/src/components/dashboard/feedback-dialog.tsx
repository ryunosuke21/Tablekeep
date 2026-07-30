"use client";

import { Button } from "@tablekeep/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tablekeep/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tablekeep/ui/components/select";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@tablekeep/ui/components/sidebar";
import { toast } from "@tablekeep/ui/components/sonner";
import { Textarea } from "@tablekeep/ui/components/textarea";
import { IconMessageCircle } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { api } from "@/trpc/react";

type FeedbackCategory = "idea" | "issue" | "other";

export function FeedbackDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const showLengthError = message.length > 0 && message.trim().length < 10;

  const submitFeedback = api.feedback.submit.useMutation({
    onSuccess: ({ reference }) => {
      toast.success("Feedback sent", {
        description: `Thanks for helping shape Tablekeep. Reference ${reference}.`,
      });
      setOpen(false);
      setCategory("idea");
      setMessage("");
    },
    onError: () => {
      toast.error("Feedback was not sent", {
        description: "Your message is still here. Try again in a moment.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <DialogTrigger asChild>
          <SidebarMenuButton tooltip="Feedback">
            <IconMessageCircle />
            <span>Feedback</span>
          </SidebarMenuButton>
        </DialogTrigger>
      </SidebarMenuItem>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitFeedback.mutate({
              category,
              message,
              page: pathname,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Tell us what would make Tablekeep easier to use at the table.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-5">
            <Field>
              <FieldLabel htmlFor="feedback-category">Type</FieldLabel>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as FeedbackCategory)
                }
              >
                <SelectTrigger id="feedback-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="issue">Something is confusing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={showLengthError}>
              <FieldLabel htmlFor="feedback-message">Message</FieldLabel>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What happened, or what should work differently?"
                rows={5}
                maxLength={1_000}
                aria-invalid={showLengthError}
                aria-describedby="feedback-description"
                className="min-h-28 resize-y"
              />
              <FieldDescription id="feedback-description">
                Include enough detail for us to understand the moment.
              </FieldDescription>
              {showLengthError ? (
                <FieldError>Use at least 10 characters.</FieldError>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="submit"
              disabled={submitFeedback.isPending || message.trim().length < 10}
            >
              {submitFeedback.isPending ? "Sending…" : "Send feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
