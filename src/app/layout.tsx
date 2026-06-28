/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projeto Leo Barros - Fundação Next.js",
  description: "Base técnica paralela para a migração controlada do projeto.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
