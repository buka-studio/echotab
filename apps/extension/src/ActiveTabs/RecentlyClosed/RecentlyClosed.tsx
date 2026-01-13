import { Badge } from "@echotab/ui/Badge";
import { Button } from "@echotab/ui/Button";
import { BrowsersIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import ExpandIcon from "~/components/ExpandIcon";

import ItemGrid from "../../Bookmarks/ItemGrid";
import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../../components/ItemListPlaceholder";
import TabItem, { Favicon } from "../../components/TabItem";
import { ActiveTab } from "../../models";
import { recentlyClosedActions, useRecentlyClosedStore } from "../../store/recentlyClosedStore";

function RecentlyClosedTabItem({ tab }: { tab: ActiveTab }) {
  return (
    <TabItem
      tab={tab}
      hideFavicon={false}
      icon={<Favicon src={tab.url} />}
      linkPreview={false}
      link={
        <a
          className="cursor-pointer overflow-hidden rounded-sm text-ellipsis whitespace-nowrap hover:underline focus-visible:underline focus-visible:outline-none"
          target="_blank"
          href={tab.url}>
          {tab.url}
        </a>
      }
    />
  );
}

export default function RecentlyClosed() {
  const recentlyClosedTabs = useRecentlyClosedStore((s) => s.tabs);
  const [expanded, setExpanded] = useState(true);

  const visibleTabs = recentlyClosedTabs.slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 items-center px-2 text-sm select-none">
        <span className="mr-2 inline-flex gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <BrowsersIcon className="h-4 w-4" /> Recently Closed
          </span>
          <Badge variant="card">{recentlyClosedTabs.length}</Badge>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setExpanded(!expanded);
          }}>
          <ExpandIcon expanded={expanded} />
        </Button>
        {recentlyClosedTabs.length > 0 && (
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              recentlyClosedActions.clear();
            }}>
            <XIcon className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {expanded && (
        <>
          {visibleTabs.length === 0 && (
            <ItemListPlaceholder
              layout="grid"
              count={5}
              className="[&_.items-placeholder]:max-h-[110px]">
              <ItemListPlaceholderCopy
                title="No closed tabs yet."
                subtitle="Recently closed tabs will appear here."
              />
            </ItemListPlaceholder>
          )}
          <ItemGrid items={visibleTabs.map((t) => t.id!)} className="dark:shadow-sm">
            {({ index }) => {
              const tab = visibleTabs[index];
              if (!tab) {
                return null;
              }

              return <RecentlyClosedTabItem tab={tab} />;
            }}
          </ItemGrid>
        </>
      )}
    </div>
  );
}
