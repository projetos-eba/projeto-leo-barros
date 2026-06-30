"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type InfoHintProps = {
  label: string;
  side?: "left" | "right";
};

export function InfoHint({ label, side = "right" }: InfoHintProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="group relative inline-flex shrink-0 items-center"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-expanded={open}
        aria-label={label}
        className="inline-flex size-5 items-center justify-center rounded-full text-[#718795] outline-none transition-colors hover:text-[#c8d7e0] focus-visible:text-[#c8d7e0] focus-visible:ring-2 focus-visible:ring-[#2d9cff]/70"
        data-info-hint-trigger="true"
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        type="button"
      >
        <Info className="size-3.5" />
      </button>
      <span
        className={cn(
          "pointer-events-none absolute top-7 z-20 w-[min(260px,calc(100vw-32px))] rounded-[8px] border border-[#31536a] bg-[#071b27] px-3 py-2 text-[12px] font-normal leading-[17px] text-[#c8d7e0] opacity-0 shadow-[0_14px_38px_rgba(0,0,0,0.28)] transition-opacity max-sm:fixed max-sm:inset-x-4 max-sm:bottom-5 max-sm:top-auto max-sm:w-auto",
          open && "opacity-100",
          side === "left" ? "left-0" : "right-0",
        )}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
