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
        className={cn({
          "text-primary transition-all duration-200": hoveredMention === link.localId,
        })}>
        {link.title}
      </span>{" "}
      -{" "}
      <span className="text-muted-foreground group">
        <a
          href={link.url}
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
