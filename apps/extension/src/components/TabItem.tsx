import { HoverCard, HoverCardContent, HoverCardTrigger } from "@echotab/ui/HoverCard";
import { Spinner } from "@echotab/ui/Spinner";
import { cn } from "@echotab/ui/util";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ComponentProps, ReactNode } from "react";

import { Tab } from "../models";
import EchoItem from "./EchoItem";

function makeFaviconUrl(pageUrl: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "64");

  return url.toString();
}

export function Favicon({
  src,
  className,
  blur = false,
}: {
  className?: string;
  src?: string;
  blur?: boolean;
}) {
  return (
    <div
      className={cn(
        "outline-muted-foreground/20 relative flex h-7 w-7 items-center justify-center overflow-hidden rounded outline-1 dark:shadow",
        className,
      )}>
      {src ? (
        <div className="relative z-1 h-6 w-6 overflow-hidden rounded-[3px]">
          <img
            src={makeFaviconUrl(src)}
            className="absolute inset-0 h-full w-full object-cover"
            alt=""
          />
        </div>
      ) : (
        <div className="fallback from-foreground/10 to-foreground/5 h-full w-full bg-linear-to-b" />
      )}
      {src && blur && (
        <img
          src={makeFaviconUrl(src)}
          className="absolute inset-0 h-full w-full scale-150 object-cover blur-xs"
          alt=""
        />
      )}
    </div>
  );
}

// doesn't really work
const LinkPreview = ({ url }: { url: string }) => {
  return (
    <div className="relative h-full w-full">
      <Spinner className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <iframe
        src={url}
        title={`Preview of ${url}`}
        scrolling="no"
        className="pointer-events-none relative z-1 h-full w-full border-none"
        // @ts-ignore
        credentialless="true"
      />
    </div>
  );
};

interface Props {
  tab: Tab;
  hideFavicon?: boolean;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
  link?: ReactNode;
  linkPreview?: boolean | ReactNode;
  children?: ReactNode;
}

function TabItem({
  tab,
  actions,
  className,
  icon,
  link,
  hideFavicon,
  linkPreview = true,
  ...props
}: Props & Partial<ComponentProps<typeof EchoItem>>) {
  return (
    <EchoItem
      icon={!hideFavicon && (icon || <Favicon src={tab.url} />)}
      title={tab.title}
      desc={
        linkPreview ? (
          <HoverCard openDelay={1000}>
            <HoverCardTrigger asChild>{link}</HoverCardTrigger>
            <ArrowTopRightIcon className="icon h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover/desc:opacity-100" />
            <HoverCardContent className="h-[300px] w-[350px] overflow-hidden p-0">
              {typeof linkPreview === "boolean" ? <LinkPreview url={tab.url} /> : linkPreview}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <>
            {link}
            <ArrowTopRightIcon className="icon h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover/desc:opacity-100" />
          </>
        )
      }
      actions={actions}
      className={cn("tab-item", className)}
      {...props}
    />
  );
}

export default TabItem;
