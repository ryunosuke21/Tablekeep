"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconMessageCircle } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

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

import {
  type FeedbackFormValues,
  feedbackFormSchema,
} from "@/lib/validation/feedback";
import { api } from "@/trpc/react";

export function FeedbackDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: "idea",
      message: "",
    },
    mode: "onChange",
  });

  const submitFeedback = api.feedback.submit.useMutation({
    onSuccess: ({ reference }) => {
      toast.success("Feedback sent", {
        description: `Thanks for helping shape Tablekeep. Reference ${reference}.`,
      });
      setOpen(false);
      form.reset();
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
          onSubmit={form.handleSubmit((values) => {
            submitFeedback.mutate({
              ...values,
              page: pathname,
            });
          })}
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
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="feedback-category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="issue">
                        Something is confusing
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.message)}>
              <FieldLabel htmlFor="feedback-message">Message</FieldLabel>
              <Textarea
                id="feedback-message"
                {...form.register("message")}
                placeholder="What happened, or what should work differently?"
                rows={5}
                maxLength={1_000}
                aria-invalid={Boolean(form.formState.errors.message)}
                aria-describedby={
                  form.formState.errors.message
                    ? "feedback-description feedback-error"
                    : "feedback-description"
                }
                className="min-h-28 resize-y"
              />
              <FieldDescription id="feedback-description">
                Include enough detail for us to understand the moment.
              </FieldDescription>
              {form.formState.errors.message ? (
                <FieldError id="feedback-error">
                  {form.formState.errors.message.message}
                </FieldError>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="submit"
              disabled={submitFeedback.isPending || !form.formState.isValid}
            >
              {submitFeedback.isPending ? "Sending…" : "Send feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
