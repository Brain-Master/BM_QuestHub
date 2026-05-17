"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitLeadToYandex } from "@/lib/lead-submit-client";
import { leadSchema, type LeadFormInput, type LeadPayload } from "@/lib/schemas";

type Props = {
  defaults: Omit<
    LeadFormInput,
    | "leadType"
    | "parentName"
    | "contact"
    | "childName"
    | "childAge"
    | "comment"
    | "consent"
  > & {
    consent?: boolean;
    leadType?: LeadFormInput["leadType"];
  };
  submitLabel?: string;
  onSuccess?: () => void;
};

export function BookingForm({
  defaults,
  submitLabel = "Отправить заявку",
  onSuccess,
}: Props) {
  const form = useForm<LeadFormInput, unknown, LeadPayload>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadType: "booking",
      parentName: "",
      contact: "",
      childName: "",
      childAge: "",
      comment: "",
      consent: false,
      ...defaults,
    },
  });

  async function onSubmit(values: LeadPayload) {
    const res = await submitLeadToYandex(values);
    if (!res.ok) {
      form.setError("root", { message: res.error });
      return;
    }
    onSuccess?.();
    form.reset({
      leadType: "booking",
      ...defaults,
      parentName: "",
      contact: "",
      childName: "",
      childAge: "",
      comment: "",
      consent: false,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="parentName">Имя родителя</Label>
        <Input
          id="parentName"
          autoComplete="name"
          {...form.register("parentName")}
        />
        {form.formState.errors.parentName?.message ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.parentName.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact">Телефон или email</Label>
        <Input
          id="contact"
          autoComplete="tel email"
          inputMode="tel"
          {...form.register("contact")}
        />
        {form.formState.errors.contact?.message ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.contact.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="childName">Имя ребёнка</Label>
          <Input
            id="childName"
            autoComplete="given-name"
            {...form.register("childName")}
          />
          {form.formState.errors.childName?.message ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.childName.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="childAge">Возраст или класс</Label>
          <Input
            id="childAge"
            placeholder="Например, 8 лет или 2 класс"
            {...form.register("childAge")}
          />
          {form.formState.errors.childAge?.message ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.childAge.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comment">Комментарий</Label>
        <textarea
          id="comment"
          rows={3}
          placeholder="Аллергии, особенности, вопросы по расписанию"
          className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("comment")}
        />
      </div>

      <div className="flex items-start gap-2">
        <Controller
          control={form.control}
          name="consent"
          render={({ field }) => (
            <Checkbox
              id="consent"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
          )}
        />
        <Label htmlFor="consent" className="text-xs leading-snug font-normal">
          Согласен(на) на обработку персональных данных в соответствии с
          политикой BrainMaster и целью заявки на программу.
        </Label>
      </div>
      {form.formState.errors.consent?.message ? (
        <p className="text-xs text-destructive">
          {form.formState.errors.consent.message}
        </p>
      ) : null}

      {form.formState.errors.root?.message ? (
        <p className="text-xs text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Отправка…" : submitLabel}
      </Button>
    </form>
  );
}
