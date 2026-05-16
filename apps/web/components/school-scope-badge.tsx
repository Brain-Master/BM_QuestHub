"use client";

import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";

export function SchoolScopeBadge() {
  const searchParams = useSearchParams();
  const schoolSlug = searchParams.get("school")?.trim();

  if (!schoolSlug) return null;

  return (
    <Badge variant="outline" className="border-white/10 bg-transparent">
      school={schoolSlug}
    </Badge>
  );
}
