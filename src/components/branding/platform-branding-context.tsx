"use client";

import type { ReactNode } from "react";

import type { PlatformBranding } from "@/lib/branding/platform-branding-contract";
import { PlatformBrandingContext } from "./platform-branding-store";

type PlatformBrandingProviderProps = {
  branding: PlatformBranding;
  children: ReactNode;
};

export function PlatformBrandingProvider({
  branding,
  children,
}: PlatformBrandingProviderProps) {
  return (
    <PlatformBrandingContext.Provider value={branding}>
      {children}
    </PlatformBrandingContext.Provider>
  );
}
