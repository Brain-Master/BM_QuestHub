"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitLeadToYandex } from "@/lib/lead-submit-client";
import { LEGAL_PERSONAL_DATA_PATH } from "@/lib/legal-routes";
import type { RegistrationFlowContext } from "@/lib/registration-flow";
import { leadSchema, type LeadFormInput, type LeadPayload } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export type BookingFormSummary = {
  venueName: string;
  questTitle: string;
  dates: string;
  format: string;
  priceLabel: string;
};

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
  summary?: BookingFormSummary;
  flowContext?: RegistrationFlowContext;
  submitLabel?: string;
  onSuccess?: (values: LeadPayload) => void;
};

const fieldLabelClass =
  "text-slate-400 text-sm font-medium [&>span]:text-white/90";

const fieldInputClass =
  "h-auto rounded-lg border-slate-700 bg-[#0B1120] px-4 py-2.5 text-sm text-white shadow-none placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500 dark:bg-[#0B1120] dark:disabled:bg-[#0B1120]/60";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

function BookingSummaryCard({ summary }: { summary: BookingFormSummary }) {
  return (
    <div
      data-testid="booking-summary"
      className="mb-1 rounded-xl border border-slate-800 bg-[#0B1120] p-4"
    >
      <p className="mb-1 font-medium text-cyan-400 text-sm">{summary.venueName}</p>
      <p className="mb-3 font-bold text-white leading-tight">{summary.questTitle}</p>
      <dl className="flex flex-col gap-1.5 text-slate-300 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Даты:</dt>
          <dd className="text-right">{summary.dates}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Формат:</dt>
          <dd className="text-right font-medium">{summary.format}</dd>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-3 border-slate-800 border-t pt-1.5">
          <dt className="text-slate-500">К оплате:</dt>
          <dd className="font-bold text-white">{summary.priceLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

export function BookingForm({
  defaults,
  summary,
  flowContext,
  submitLabel,
  onSuccess,
}: Props) {
  const resolvedSubmitLabel =
    submitLabel ?? flowContext?.submitLabel ?? "Забронировать место";
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
    onSuccess?.(values);
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

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      {summary ? <BookingSummaryCard summary={summary} /> : null}

      {flowContext ? (
        <div
          data-testid="booking-flow-notice"
          className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm leading-relaxed"
        >
          <p className="mb-1 font-semibold text-cyan-100">
            {flowContext.noticeTitle}
          </p>
          <p className="text-cyan-50/80">{flowContext.noticeText}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="parentName" className={fieldLabelClass}>
            Имя родителя <span className="text-white">*</span>
          </Label>
          <Input
            id="parentName"
            autoComplete="name"
            placeholder="Иван Иванов"
            className={fieldInputClass}
            aria-invalid={Boolean(form.formState.errors.parentName)}
            {...form.register("parentName")}
          />
          <FieldError message={form.formState.errors.parentName?.message} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="contact" className={fieldLabelClass}>
            Телефон <span className="text-white">*</span>
          </Label>
          <Input
            id="contact"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+7 (999) 000-00-00"
            className={fieldInputClass}
            aria-invalid={Boolean(form.formState.errors.contact)}
            {...form.register("contact")}
          />
          <FieldError message={form.formState.errors.contact?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-slate-800 border-t pt-2">
        <div className="grid gap-1.5">
          <Label htmlFor="childName" className={fieldLabelClass}>
            Имя и фамилия ребёнка <span className="text-white">*</span>
          </Label>
          <Input
            id="childName"
            autoComplete="given-name"
            placeholder="Петя Иванов"
            className={fieldInputClass}
            aria-invalid={Boolean(form.formState.errors.childName)}
            {...form.register("childName")}
          />
          <FieldError message={form.formState.errors.childName?.message} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="childAge" className={fieldLabelClass}>
            Возраст полных лет <span className="text-white">*</span>
          </Label>
          <Input
            id="childAge"
            placeholder="Например: 9"
            className={fieldInputClass}
            aria-invalid={Boolean(form.formState.errors.childAge)}
            {...form.register("childAge")}
          />
          <FieldError message={form.formState.errors.childAge?.message} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="comment" className={fieldLabelClass}>
          Комментарий{" "}
          <span className="font-normal text-slate-500">(необязательно)</span>
        </Label>
        <textarea
          id="comment"
          rows={2}
          placeholder="Особенности питания, аллергии или пожелания..."
          className={cn(
            fieldInputClass,
            "min-h-[4.5rem] resize-none focus-visible:outline-none",
          )}
          {...form.register("comment")}
        />
      </div>

      <div className="flex items-start gap-2.5">
        <Controller
          control={form.control}
          name="consent"
          render={({ field }) => (
            <Checkbox
              id="consent"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              className="mt-0.5 border-slate-600 data-checked:border-cyan-500 data-checked:bg-cyan-600"
            />
          )}
        />
        <Label
          htmlFor="consent"
          className="text-slate-400 text-xs leading-snug font-normal"
        >
          Согласен(на) на обработку персональных данных в соответствии с{" "}
          <Link
            href={LEGAL_PERSONAL_DATA_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 underline underline-offset-3 hover:text-cyan-200"
          >
            политикой обработки персональных данных
          </Link>{" "}
          и целью заявки на программу.
        </Label>
      </div>
      <FieldError message={form.formState.errors.consent?.message} />

      <FieldError message={form.formState.errors.root?.message} />

      <div className="grid gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all",
            "hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_25px_rgba(8,145,178,0.5)]",
            "disabled:cursor-not-allowed disabled:opacity-70",
          )}
        >
          {isSubmitting ? "Отправка…" : resolvedSubmitLabel}
        </button>
        <p className="text-center text-[11px] text-slate-500 leading-snug">
          Нажимая кнопку, вы даёте согласие на обработку персональных данных.
        </p>
      </div>
    </form>
  );
}
