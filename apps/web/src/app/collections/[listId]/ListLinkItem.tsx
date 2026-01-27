"use client";

import { PublicLink } from "@echotab/lists/models";
import { cn } from "@echotab/ui/util";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

import { useListContext } from "./ListContext";

function truncateURL(url: string) {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;
  const hostname = urlObject.hostname;
  const port = urlObject.port;
  const protocol = urlObject.protocol;
  const search = urlObject.search;
  const hash = urlObject.hash;

  return `${hostname}${pathname}${search}${hash}`;
}

export default function ListLinkItem({ link, index }: { link: PublicLink, index: number }) {
  const { hoveredMention, setHoveredMention } = useListContext();

  const handleActivateLink = () => {
    if (link.localId) {
      setHoveredMention(link.localId);
    }
  };

  return (
    <div
      className={cn("text-foreground group marker:text-muted-foreground text-sm marker:text-xs whitespace-nowrap overflow-hidden flex items-center @container w-full gap-2")}
      onMouseOver={handleActivateLink}>
      <span className={cn("font-mono text-[0.625rem] text-muted-foreground font-semibold", {
        'text-primary': hoveredMention === link.localId,
      })}>[{index + 1}]
      </span>
      <span
        className={cn("text-foreground whitespace-nowrap truncate overflow-hidden max-w-[calc(100cqw-16px)] ", {
          "text-foreground": hoveredMention === link.localId,
        })}>
        <a
          href={link.url}
          data-mention={link.localId}
          target="_blank"
          rel="noopener noreferrer"
          onFocus={handleActivateLink}
          className="focus-visible:outline-none hover:underline focus-visible:underline">
          {truncateURL(link.url)}
        </a>
      </span>
      <ArrowTopRightIcon className="shrink-0 ml-1.5 inline-block opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150" />
    </div>
  );
}
