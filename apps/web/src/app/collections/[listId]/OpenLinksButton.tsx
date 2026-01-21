"use client";

import { PublicLink } from "@echotab/lists/models";
import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { ComponentProps } from "react";

const handleOpenLinks = async (links: string[]) => {
  for (const link of links) {
    window.open(link, "_blank");
    await new Promise((r) => setTimeout(r, 100));
  }
};

export default function OpenLinksButton({
  links,
  className,
  children,
  ...props
}: { links: PublicLink[] } & ComponentProps<typeof Button>) {
  return (
    <ButtonWithTooltip
      tooltipText="Open all links"
      variant="ghost"
      side="top"
      size="icon-sm"
      onClick={() => handleOpenLinks(links.map((link) => link.url))}
      className={cn("gap-2", className)}
      {...props}>
      <ExternalLinkIcon className="size-4" />
    </ButtonWithTooltip>
  );
}
