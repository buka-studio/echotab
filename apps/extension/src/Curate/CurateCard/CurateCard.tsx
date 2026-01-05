import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import { cn } from "@echotab/ui/util";
import { BookmarkSimpleIcon, GlobeSimpleIcon, ImageIcon, InfoIcon } from "@phosphor-icons/react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { ReactNode } from "react";

import { Favicon } from "~/components/TabItem";
import { SavedTab } from "~/models";

import { InfoDescription } from "./InfoDescription";
import { OGImage } from "./OGImage";

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
    <span>
      <BookmarkSimpleIcon
        className={cn("text-muted h-4 w-4 translate-y-[-10px] scale-[2]", {
          "opacity-100": bookmarked,
          "opacity-0": !bookmarked,
        })}
        weight="fill"
      />
    </span>
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
}: {
  tab: SavedTab;
  index: number;
  visible: boolean;
}) {
  const preload = index < 2;

  return (
    <article className="border-border bg-background flex h-[400px] w-[420px] flex-col rounded-xl border">
      <Header className="border-border border-b">
        <HeaderUrl
          className={cn("group transition-opacity duration-150", { "opacity-0": !visible })}
          right={
            <ArrowTopRightIcon className="icon h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
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
      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <Jumbo tab={tab} className="" />
        <Tabs defaultValue="image" className="flex flex-1 flex-col overflow-auto" key={tab.id}>
          <div className="flex justify-between">
            <TabsList className="ml-auto h-auto w-full rounded-md">
              <TabsTrigger value="image" className="flex-1 gap-2 rounded px-2 py-1 text-xs">
                <ImageIcon className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="info" className="flex-1 gap-2 rounded px-2 py-1 text-xs">
                <InfoIcon className="h-4 w-4" />
                Info
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="image"
            className="relative flex flex-col justify-center not-empty:flex-1">
            <OGImage tab={tab} preload={preload} />
          </TabsContent>
          <TabsContent value="info" className="overflow-auto not-empty:flex-1">
            <InfoDescription tab={tab} className="p-2 pb-3" preload={preload} />
          </TabsContent>
        </Tabs>
      </div>
    </article>
  );
}
