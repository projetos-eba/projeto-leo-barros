import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { fetchPlatformBranding } from "@/lib/branding/platform-branding";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const branding = await fetchPlatformBranding();
  const targetUrl = branding.logoUrl ?? "/favicon.ico";
  const response = NextResponse.redirect(new URL(targetUrl, request.url), 307);

  response.headers.set("Cache-Control", "no-store");
  return response;
}
