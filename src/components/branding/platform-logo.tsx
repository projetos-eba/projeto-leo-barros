"use client";

import { Activity } from "lucide-react";

import { usePlatformBranding } from "@/components/branding/use-platform-branding";
import type { PlatformBranding } from "@/lib/branding/platform-branding-contract";
import { cn } from "@/lib/utils";

type PlatformLogoProps = {
  branding?: PlatformBranding;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
  showIconFallback?: boolean;
};

export function PlatformLogo({
  branding: explicitBranding,
  className,
  fallbackClassName,
  imageClassName,
  showIconFallback = false,
}: PlatformLogoProps) {
  const contextBranding = usePlatformBranding();
  const branding = explicitBranding ?? contextBranding;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#f4f7fa] text-[#092333]",
        className,
      )}
    >
      {branding.logoUrl ? (
        <img
          alt=""
          className={cn("h-full w-full object-contain", imageClassName)}
          src={branding.logoUrl}
        />
      ) : showIconFallback ? (
        <Activity className={cn("size-5", fallbackClassName)} />
      ) : (
        <span className={cn("font-bold leading-none", fallbackClassName)}>
          {branding.initials}
        </span>
      )}
    </span>
  );
}
