"use client";

import * as React from "react";

import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";

type Props = {
  slug: string;
  name: string;
};

export function RememberSchoolOnVisit({ slug, name }: Props) {
  React.useEffect(() => {
    localStorage.setItem(
      PREFERRED_SCHOOL_STORAGE_KEY,
      JSON.stringify({ slug, name }),
    );
  }, [name, slug]);

  return null;
}
