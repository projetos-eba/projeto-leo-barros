"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlatformBrandingProvider } from "@/components/branding/platform-branding-context";
import {
  defaultPlatformBranding,
  type PlatformBranding,
} from "@/lib/branding/platform-branding-contract";

type AppProvidersProps = {
  branding?: PlatformBranding;
  children: ReactNode;
};

export function AppProviders({ branding = defaultPlatformBranding, children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlatformBrandingProvider branding={branding}>
          <Toaster />
          <Sonner />
          {children}
        </PlatformBrandingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
