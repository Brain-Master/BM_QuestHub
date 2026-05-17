"use client";

import * as React from "react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const SHOW_AFTER_SCROLL_Y = 400;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > SHOW_AFTER_SCROLL_Y);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40">
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4">
        <button
          type="button"
          className={cn(
            "pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-card/90 text-foreground shadow-lg backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-card",
            isVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
          )}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Наверх"
        >
          <ChevronUp className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
