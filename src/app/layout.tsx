/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { fetchPlatformBranding } from "@/lib/branding/platform-branding";
import type { PlatformBranding } from "@/lib/branding/platform-branding-contract";

import { AppProviders } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchPlatformBranding();

  return {
    title: {
      default: branding.platformName,
      template: `%s | ${branding.platformName}`,
    },
    description: "Acesso segmentado para Cliente, Parceiro e Admin.",
    icons: {
      icon: [{ url: branding.faviconUrl }],
      shortcut: [{ url: branding.faviconUrl }],
    },
  };
}

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const brandingPromise = fetchPlatformBranding();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <BrandingProviders brandingPromise={brandingPromise}>{children}</BrandingProviders>
      </body>
    </html>
  );
}

async function BrandingProviders({
  brandingPromise,
  children,
}: {
  brandingPromise: Promise<PlatformBranding>;
  children: ReactNode;
}) {
  const branding = await brandingPromise;

  return <AppProviders branding={branding}>{children}</AppProviders>;
}
