import { SupportPhoneLink } from "@/components/support-phone-link";
import { SupportTelegramLink } from "@/components/support-telegram-link";
import { SupportVkLink } from "@/components/support-vk-link";
import { cn } from "@/lib/utils";

type Emphasis = "community" | "support";

type Props = {
  variant: "footer" | "card" | "aside";
  title: string;
  description: string;
  emphasis?: Emphasis;
  /** Shown above action buttons on card variant (e.g. site page) */
  supportNote?: string;
  className?: string;
  /** card: hide phone (e.g. home hero aside) */
  showPhone?: boolean;
  showTelegram?: boolean;
  showVk?: boolean;
};

function ActionButtons({
  emphasis,
  layout,
  showPhone = true,
  showTelegram = true,
  showVk = true,
}: {
  emphasis: Emphasis;
  layout: "footer" | "stack" | "aside";
  showPhone?: boolean;
  showTelegram?: boolean;
  showVk?: boolean;
}) {
  const isPlain = layout === "footer";
  const vk = showVk ? (
    <SupportVkLink
      plain={isPlain}
      prominent={layout === "stack" && emphasis === "community"}
    />
  ) : null;
  const telegram = showTelegram ? (
    <SupportTelegramLink plain={isPlain} className={layout === "aside" ? "w-full" : undefined} />
  ) : null;
  const phone = showPhone ? <SupportPhoneLink plain={isPlain} /> : null;

  const communityOrder = [vk, telegram, phone];
  const supportOrder = [telegram, phone, vk];
  const items = (emphasis === "support" ? supportOrder : communityOrder).filter(Boolean);

  if (layout === "footer") {
    return <div className="flex flex-col gap-2">{items}</div>;
  }

  if (layout === "aside") {
    return <div className="grid gap-2">{items}</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-2 sm:grid-cols-1">{items}</div>
  );
}

export function CommunityConnectPanel({
  variant,
  title,
  description,
  emphasis = "community",
  supportNote,
  className,
  showPhone = true,
  showTelegram = true,
  showVk = true,
}: Props) {
  if (variant === "footer") {
    return (
      <div
        data-testid="community-connect-footer"
        className={cn("space-y-3", className)}
      >
        <p className="font-heading text-base font-semibold text-foreground">{title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        <ActionButtons emphasis={emphasis} layout="footer" showPhone showTelegram showVk />
      </div>
    );
  }

  if (variant === "aside") {
    return (
      <div
        data-testid="community-connect-aside"
        className={cn(
          "rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
          className,
        )}
      >
        <p className="font-heading text-sm font-semibold text-white">{title}</p>
        <p className="mt-2 text-zinc-400 text-xs leading-relaxed">{description}</p>
        <div className="mt-4">
          <ActionButtons
            emphasis={emphasis}
            layout="aside"
            showPhone={showPhone}
            showTelegram={showTelegram}
            showVk={showVk}
          />
        </div>
      </div>
    );
  }

  return (
    <section
      data-testid="community-connect-card"
      className={cn(
        "rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-violet-950/40 via-card/50 to-cyan-950/30 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-6",
        className,
      )}
    >
      <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-muted-foreground text-sm leading-relaxed sm:text-base">
        {description}
      </p>
      {supportNote ? (
        <p className="mt-4 text-muted-foreground text-xs uppercase tracking-[0.12em]">
          {supportNote}
        </p>
      ) : null}
      <div className="mt-5">
        <ActionButtons
          emphasis={emphasis}
          layout="stack"
          showPhone={showPhone}
          showTelegram={showTelegram}
          showVk={showVk}
        />
      </div>
    </section>
  );
}
