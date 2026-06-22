import type { ReactNode } from "react";

import { AuthenticatedShell } from "@/components/shells/authenticated-shell.next";

type ParceirosLayoutProps = {
  children: ReactNode;
};

export default function ParceirosLayout({ children }: ParceirosLayoutProps) {
  return <AuthenticatedShell profile="parceiros">{children}</AuthenticatedShell>;
}
