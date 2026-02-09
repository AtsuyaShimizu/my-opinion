"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FILTER_GROUPS: { key: string; label: string; values: { value: string; label: string }[] }[] = [
  {
    key: "gender",
    label: "性別",
    values: [
      { value: "male", label: "男性" },
      { value: "female", label: "女性" },
      { value: "other", label: "その他" },
    ],
  },
  {
    key: "age_range",
    label: "年齢帯",
    values: [
      { value: "18-24", label: "18-24" },
      { value: "25-29", label: "25-29" },
      { value: "30-34", label: "30-34" },
      { value: "35-39", label: "35-39" },
      { value: "40-44", label: "40-44" },
      { value: "45-49", label: "45-49" },
      { value: "50-54", label: "50-54" },
      { value: "55-59", label: "55-59" },
      { value: "60-64", label: "60-64" },
      { value: "65_and_over", label: "65+" },
    ],
  },
  {
    key: "occupation",
    label: "職業",
    values: [
      { value: "company_employee", label: "会社員" },
      { value: "civil_servant", label: "公務員" },
      { value: "self_employed", label: "自営業" },
      { value: "student", label: "学生" },
      { value: "professional", label: "専門職" },
      { value: "educator_researcher", label: "教育・研究" },
      { value: "executive", label: "経営者" },
    ],
  },
  {
    key: "political_stance",
    label: "政治スタンス",
    values: [
      { value: "left", label: "左派" },
      { value: "center_left", label: "やや左派" },
      { value: "center", label: "中道" },
      { value: "center_right", label: "やや右派" },
      { value: "right", label: "右派" },
    ],
  },
];

interface AttributeLensBarProps {
  activeFilters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClear: () => void;
}

export function AttributeLensBar({ activeFilters, onFilterChange, onClear }: AttributeLensBarProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const activeCount = Object.keys(activeFilters).length;

  function handleSelect(key: string, value: string) {
    const next = { ...activeFilters };
    if (next[key] === value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onFilterChange(next);
    setOpenPopover(null);
  }

  function handleRemove(key: string) {
    const next = { ...activeFilters };
    delete next[key];
    onFilterChange(next);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-medium">視点フィルター</span>
      </div>

      {FILTER_GROUPS.map((group) => {
        const activeValue = activeFilters[group.key];
        const activeLabel = activeValue
          ? group.values.find((v) => v.value === activeValue)?.label
          : null;

        return (
          <Popover
            key={group.key}
            open={openPopover === group.key}
            onOpenChange={(open) => setOpenPopover(open ? group.key : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  activeValue
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {activeLabel ?? group.label}
                {activeValue && (
                  <X
                    className="h-3 w-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(group.key);
                    }}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex flex-wrap gap-1">
                {group.values.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(group.key, opt.value)}
                    className={cn(
                      "whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors",
                      activeFilters[group.key] === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0 text-xs text-muted-foreground"
        >
          クリア
        </Button>
      )}
    </div>
  );
}
