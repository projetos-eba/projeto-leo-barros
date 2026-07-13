import { useContext } from "react";

import { PlatformBrandingContext } from "./platform-branding-store";

export function usePlatformBranding() {
  return useContext(PlatformBrandingContext);
}
