import { createContext } from "react";

import {
  defaultPlatformBranding,
  type PlatformBranding,
} from "@/lib/branding/platform-branding-contract";

export const PlatformBrandingContext = createContext<PlatformBranding>(defaultPlatformBranding);
