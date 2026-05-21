import { CommunityVkFollowHint } from "@/components/community-vk-follow-hint";
import { SupportContactStack } from "@/components/support-contact-stack";

type Props = {
  message?: string;
};

export function BookingSubmitError({ message }: Props) {
  if (!message) return null;

  return (
    <div
      data-testid="booking-submit-error"
      className="grid gap-3 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-3"
    >
      <p className="text-red-200 text-xs leading-relaxed">{message}</p>
      <p className="text-red-100/90 text-xs font-medium">Свяжитесь с нами</p>
      <SupportContactStack className="max-w-none" />
      <CommunityVkFollowHint />
    </div>
  );
}
