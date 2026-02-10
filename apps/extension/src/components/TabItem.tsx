import { useCopyToClipboard } from "@echotab/ui/hooks";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@echotab/ui/HoverCard";
import { cn } from "@echotab/ui/util";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentProps, ReactNode } from "react";

import { Tab } from "../models";
import EchoItem from "./EchoItem";
import { TabInfoPreview } from "./TabInfoPreview";

function makeFaviconUrl(pageUrl: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "64");

  return url.toString();
}

const MotionCopyIcon = motion(CopyIcon);
const MotionCheckIcon = motion(CheckIcon);

function CopyButton({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <button onClick={onCopy}>
      <AnimatePresence initial={false} mode="wait">
        {copied ? (
          <MotionCheckIcon
            className={cn(
              "icon text-foreground size-4 shrink-0 opacity-0 group-focus-within/desc:opacity-100 group-hover/desc:opacity-100",
            )}
            key="copied"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [1, 0, 1],
            }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, times: [0, 0.5, 1] }}
          />
        ) : (
          <MotionCopyIcon
            className={cn(
              "icon size-4 shrink-0 opacity-0 transition-opacity duration-100 group-hover/desc:opacity-100",
            )}
            key="copy"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
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
  const [copied, copy] = useCopyToClipboard({ timeout: 1600 });

  const handleCopy = () => {
    copy(tab.url);
  };

  return (
    <EchoItem
      icon={!hideFavicon && (icon || <Favicon src={tab.url} />)}
      title={tab.title}
      desc={
        linkPreview ? (
          <>
            <HoverCard openDelay={1000}>
              <HoverCardTrigger
                asChild
                className={cn("transition-all duration-500", {
                  "animate-shimmer-text-copy": copied,
                })}>
                {link}
              </HoverCardTrigger>
              <ArrowTopRightIcon className="icon size-4 shrink-0 opacity-0 transition-opacity duration-100 group-focus-within/desc:opacity-100 group-hover/desc:opacity-100" />

              <HoverCardContent className="w-[375px] overflow-hidden p-0">
                {typeof linkPreview === "boolean" ? (
                  <TabInfoPreview tab={tab} contentClassName="min-h-[196px] max-h-[196px]" />
                ) : (
                  linkPreview
                )}
              </HoverCardContent>
            </HoverCard>
            <CopyButton onCopy={handleCopy} copied={Boolean(copied)} />
          </>
        ) : (
          <>
            <Slot
              className={cn("transition-all duration-500", {
                "animate-shimmer-text-copy": copied,
              })}>
              {link}
            </Slot>
            <ArrowTopRightIcon className="icon h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover/desc:opacity-100" />
            <CopyButton onCopy={handleCopy} copied={Boolean(copied)} />
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
