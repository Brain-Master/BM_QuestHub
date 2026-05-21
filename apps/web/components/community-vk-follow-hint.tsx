import { BRAINMASTER_COMMUNITY_VK_URL } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function CommunityVkFollowHint({ className }: Props) {
  return (
    <p
      data-testid="community-vk-follow-hint"
      className={cn("text-slate-400 text-xs leading-relaxed", className)}
    >
      Пока ждёте ответ —{" "}
      <a
        href={BRAINMASTER_COMMUNITY_VK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-300/90 underline-offset-2 hover:text-cyan-200 hover:underline"
      >
        загляните в нашу группу ВКонтакте
      </a>
    </p>
  );
}
