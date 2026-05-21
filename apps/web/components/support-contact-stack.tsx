import { SupportPhoneLink } from "@/components/support-phone-link";
import { SupportTelegramLink } from "@/components/support-telegram-link";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  phoneClassName?: string;
  telegramClassName?: string;
};

export function SupportContactStack({
  className,
  phoneClassName,
  telegramClassName,
}: Props) {
  return (
    <div
      data-testid="support-contact-stack"
      className={cn("mx-auto grid w-full max-w-xs gap-2", className)}
    >
      <SupportPhoneLink className={cn("w-full", phoneClassName)} />
      <SupportTelegramLink className={telegramClassName} />
    </div>
  );
}
