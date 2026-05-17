"use client";

import { Boxes } from "lucide-react";

import {
  ALL_PROGRAM_FILTER_VALUE,
  type ProgramFilterGroup,
} from "@/lib/program-filter-options";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  groups: ProgramFilterGroup[];
  onValueChange: (value: string) => void;
  triggerTestId?: string;
  triggerClassName?: string;
  allLabel?: string;
};

export function ProgramFilterSelect({
  value,
  groups,
  onValueChange,
  triggerTestId,
  triggerClassName,
  allLabel = "Все программы",
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue);
      }}
    >
      <SelectTrigger
        data-testid={triggerTestId}
        className={cn("w-full border-white/10 bg-black/20", triggerClassName)}
      >
        <SelectValue placeholder="Программа" />
      </SelectTrigger>
      <SelectContent className="min-w-[280px]">
        <SelectItem value={ALL_PROGRAM_FILTER_VALUE}>{allLabel}</SelectItem>
        {groups.map((group) => (
          <SelectGroup key={group.value}>
            <SelectItem value={group.value} className="font-medium">
              <Boxes className="size-3.5 text-muted-foreground" aria-hidden />
              {group.label}
            </SelectItem>
            {group.programs.map((program) => (
              <SelectItem
                key={program.value}
                value={program.value}
                className="pl-6 text-muted-foreground"
              >
                {program.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
