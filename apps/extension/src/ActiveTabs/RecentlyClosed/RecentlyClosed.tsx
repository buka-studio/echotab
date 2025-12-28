import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { CaretSortIcon, ClockIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import ItemGrid from "../../Bookmarks/ItemGrid";
import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../../components/ItemListPlaceholder";
import TabItem, { Favicon } from "../../components/TabItem";
import { ActiveTab } from "../../models";
import { useRecentlyClosedStore } from "./RecentlyClosedStore";

function RecentlyClosedTabItem({ tab }: { tab: ActiveTab }) {
  return (
    <TabItem
      tab={tab}
      hideFavicon={false}
      icon={<Favicon src={tab.url} />}
      linkPreview={false}
      link={
        <a
          className="overflow-hidden rounded-sm text-ellipsis whitespace-nowrap focus-visible:underline focus-visible:outline-none"
          target="_blank"
          href={tab.url}>
          {tab.url}
        </a>
      }
    />
  );
}

export default function RecentlyClosed() {
  const recentlyClosedStore = useRecentlyClosedStore();
  const [expanded, setExpanded] = useState(true);

  const recentlyClosedTabs = recentlyClosedStore.tabs.slice(0, 10);

  return (
    <div>
      <div className="mb-2 flex items-center px-2 text-sm select-none">
        <span className="mr-2 inline-flex gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <ClockIcon /> Recently Closed
          </span>
          <Badge variant="card">{recentlyClosedTabs.length}</Badge>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setExpanded(!expanded);
          }}>
          <CaretSortIcon className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <>
          {recentlyClosedTabs.length === 0 && (
            <ItemListPlaceholder
              layout="grid"
              count={5}
              className="[&_.items-placeholder]:max-h-[110px]">
              <ItemListPlaceholderCopy
                title="No recently closed tabs."
                subtitle="Closed tabs will appear here."
              />
            </ItemListPlaceholder>
          )}
          <ItemGrid items={recentlyClosedTabs.map((t) => t.id!)}>
            {({ index }) => {
              const tab = recentlyClosedTabs[index];
              return <RecentlyClosedTabItem tab={tab} />;
            }}
          </ItemGrid>
        </>
      )}
    </div>
  );
}
