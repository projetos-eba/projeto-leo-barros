"use client";

import { useEffect } from "react";

type DynamicFaviconProps = {
  href: string;
};

const managedAttribute = "data-platform-favicon";

export function DynamicFavicon({ href }: DynamicFaviconProps) {
  useEffect(() => {
    const selector = `link[rel~="icon"][${managedAttribute}="true"]`;
    const existing = document.head.querySelector<HTMLLinkElement>(selector);
    const link = existing ?? document.createElement("link");

    link.setAttribute("rel", "icon");
    link.setAttribute("href", href);
    link.setAttribute(managedAttribute, "true");

    if (!existing) {
      document.head.appendChild(link);
    }
  }, [href]);

  return null;
}
