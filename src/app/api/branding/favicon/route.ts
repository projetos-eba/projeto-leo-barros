import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { fetchPlatformBranding } from "@/lib/branding/platform-branding";

export const dynamic = "force-dynamic";

async function fallbackIcon() {
  const bytes = await readFile(path.join(process.cwd(), "public", "favicon.ico"));

  return new NextResponse(bytes, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/x-icon",
    },
  });
}

export async function GET(request: NextRequest) {
  const branding = await fetchPlatformBranding();
  const versioned = request.nextUrl.searchParams.has("v");

  if (!branding.logoUrl || !branding.logo) {
    const response = await fallbackIcon();
    if (!versioned) response.headers.set("Cache-Control", "no-store");
    return response;
  }

  try {
    const upstream = await fetch(branding.logoUrl, {
      cache: "no-store",
    });

    if (!upstream.ok) {
      const response = await fallbackIcon();
      if (!versioned) response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      headers: {
        "Cache-Control": versioned
          ? "public, max-age=31536000, immutable"
          : "no-store",
        "Content-Type": branding.logo.contentType,
      },
    });
  } catch {
    const response = await fallbackIcon();
    if (!versioned) response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
