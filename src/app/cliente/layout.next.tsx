import type { ReactNode } from "react";

import { AuthenticatedShell } from "@/components/shells/authenticated-shell.next";

type ClienteLayoutProps = {
  children: ReactNode;
};

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  return <AuthenticatedShell profile="cliente">{children}</AuthenticatedShell>;
}
