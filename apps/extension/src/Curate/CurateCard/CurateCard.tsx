import { cn } from "@echotab/ui/util";
import { BookmarkSimpleIcon, GlobeSimpleIcon } from "@phosphor-icons/react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { ReactNode } from "react";

import { TabInfoPreview } from "~/components/TabInfoPreview";
import { Favicon } from "~/components/TabItem";
import { SavedTab } from "~/models";

const Header = ({
  children,
  bookmarked = true,
  className,
}: {
  children: ReactNode;
  bookmarked?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "header bg-surface-1 relative flex w-full items-center justify-between gap-5 overflow-hidden rounded-t-xl px-4 py-2",
      className,
    )}>
    <div className="flex items-center justify-center gap-1">
      <div className="bg-muted h-3 w-3 rounded-full" />
      <div className="bg-muted h-3 w-3 rounded-full" />
      <div className="bg-muted h-3 w-3 rounded-full" />
    </div>
    {children}
    <div className="flex w-8 justify-end">
      <BookmarkSimpleIcon
        className={cn("text-muted h-4 w-4 translate-y-[-10px] scale-[2]", {
          "opacity-100": bookmarked,
          "opacity-0": !bookmarked,
        })}
        weight="fill"
      />
    </div>
  </div>
);

const HeaderUrl = ({
  children,
  className,
  right,
}: {
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) => (
  <div
    className={cn(
      "text-muted-foreground bg-surface-2 border-border flex items-center overflow-hidden rounded-full border px-2 py-1 pl-1 text-xs",
      className,
    )}>
    <GlobeSimpleIcon className="mr-2 h-4 w-4 shrink-0" />
    <span className="line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
    {right}
  </div>
);

const formatSavedAt = (savedAt: string) => {
  return formatDistanceToNow(savedAt);
};

const Jumbo = ({ tab, className }: { tab: SavedTab; className?: string }) => {
  return (
    <div className={cn("flex items-center gap-3 pr-2", className)}>
      <Favicon src={tab.url} className="bg-muted h-10 w-10 shrink-0 rounded-lg *:h-8 *:w-8" />
      <div className="flex flex-col text-left">
        <h1 className="line-clamp-1 text-sm font-semibold break-all">{tab.title}</h1>
        {tab.savedAt && (
          <div className="text-muted-foreground text-sm">
            Last visited {formatSavedAt(tab.visitedAt || tab.savedAt)} ago
          </div>
        )}
      </div>
    </div>
  );
};

export default function CurateCard({
  tab,
  index,
  visible,
  hidden,
}: {
  tab: SavedTab;
  index: number;
  visible: boolean;
  hidden: boolean;
}) {
  const preload = index < 3;

  return (
    <article className="border-border bg-background flex w-[500px] flex-col rounded-xl border">
      <Header className="border-border border-b">
        <HeaderUrl
          className={cn("group max-w-[calc(100%-160px)] transition-opacity duration-250", {
            "opacity-0": !visible,
          })}
          right={
            <ArrowTopRightIcon className="icon ml-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
          }>
          <a
            href={tab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus-visible:underline focus-visible:outline-none">
            {tab.url}
          </a>
        </HeaderUrl>
      </Header>
      {hidden ? <div className="min-h-[368px]" />
        :
        <div className="flex flex-1 flex-col gap-3 p-3 pt-3">
          <Jumbo tab={tab} className="" />
          <TabInfoPreview tab={tab} preload={preload} contentClassName="min-h-[245px] max-h-[245px]" className="gap-2" />
        </div>}
    </article>
  );
}
