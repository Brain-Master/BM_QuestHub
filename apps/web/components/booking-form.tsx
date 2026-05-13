"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { submitLead } from "@/app/actions/submit-lead";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leadSchema, type LeadPayload } from "@/lib/schemas";

type Props = {
  defaults: Omit<
    LeadPayload,
    "parentName" | "contact" | "consent"
  > & { consent?: boolean };
  onSuccess?: () => void;
};

export function BookingForm({ defaults, onSuccess }: Props) {
  const form = useForm<LeadPayload>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      parentName: "",
      contact: "",
      consent: false,
      ...defaults,
    },
  });

  async function onSubmit(values: LeadPayload) {
    const res = await submitLead(values);
    if (!res.ok) {
      form.setError("root", { message: res.error });
      return;
    }
    onSuccess?.();
    form.reset({
      ...defaults,
      parentName: "",
      contact: "",
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
        {form.formState.isSubmitting ? "Отправка…" : "Отправить заявку"}
      </Button>
    </form>
  );
}
