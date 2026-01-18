"use client";

import { PublicLink } from "@echotab/lists/models";
import { cn } from "@echotab/ui/util";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

import { useListContext } from "./ListContext";

export default function ListLinkItem({ link }: { link: PublicLink }) {
  const { hoveredMention, setHoveredMention } = useListContext();

  const handleActivateLink = () => {
    if (link.localId) {
      setHoveredMention(link.localId);
    }
  };

  return (
    <li
      className={cn("text-foreground marker:text-muted-foreground text-sm marker:text-xs")}
      onMouseOver={handleActivateLink}>
      <span
        className={cn("text-muted-foreground group", {
          "text-foreground": hoveredMention === link.localId,
        })}>
        <a
          href={link.url}
          data-mention={link.localId}
          target="_blank"
          rel="noopener noreferrer"
          onFocus={handleActivateLink}
          className="focus-visible:underline focus-visible:outline-none">
          {link.url}
        </a>
        <ArrowTopRightIcon className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
    </li>
  );
}
