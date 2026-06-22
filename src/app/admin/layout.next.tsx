import type { ReactNode } from "react";

import { AuthenticatedShell } from "@/components/shells/authenticated-shell.next";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AuthenticatedShell profile="admin">{children}</AuthenticatedShell>;
}
