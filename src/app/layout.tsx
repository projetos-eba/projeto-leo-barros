/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projeto Leo Barros",
  description: "Acesso segmentado para Cliente, Parceiro e Admin.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
