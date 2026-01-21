import { Badge } from "@echotab/ui/Badge";
import { Button } from "@echotab/ui/Button";
import { DrawingPinFilledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import ExpandIcon from "~/components/ExpandIcon";

import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../components/ItemListPlaceholder";
import { usePinnedTabs } from "../store/bookmarkStore";
import ItemGrid from "./ItemGrid";
import SavedTabItem from "./SavedTabItem";

export default function Pinned() {
  const pinnedTabs = usePinnedTabs();

  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center px-2 text-sm select-none">
        <span className="mr-2 inline-flex gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <DrawingPinFilledIcon /> Pinned
          </span>
          <Badge variant="card">{pinnedTabs?.length}</Badge>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setExpanded(!expanded);
          }}>
          <ExpandIcon expanded={expanded} />
        </Button>
      </div>

      {expanded && (
        <>
          {pinnedTabs.length === 0 && (
            <ItemListPlaceholder
              layout="grid"
              count={5}
              className="[&_.items-placeholder]:max-h-[110px]">
              <ItemListPlaceholderCopy
                title="No pinned bookmarks yet."
                subtitle="Keep your important bookmarks pinned for quick access."
              />
            </ItemListPlaceholder>
          )}
          <ItemGrid items={pinnedTabs.map((t) => t.id)}>
            {({ index }) => {
              const tab = pinnedTabs[index];

              if (!tab) {
                return null;
              }

              return <SavedTabItem tab={tab} />;
            }}
          </ItemGrid>
        </>
      )}
    </div>
  );
}
