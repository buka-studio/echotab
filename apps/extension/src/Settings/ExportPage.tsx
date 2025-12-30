import { Button } from "@echotab/ui/Button";

import { useBookmarkStore } from "../Bookmarks";
import { unassignedTag, useTagStore } from "../TagStore";
import { downloadJSON } from "../util";

export default function MiscPage() {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();

  const handleExport = () => {
    downloadJSON(
      {
        tabs: bookmarkStore.tabs,
        tags: Array.from(tagStore.tags.values()).filter((t) => t.id !== unassignedTag.id),
        lists: bookmarkStore.lists,
      },
      `echotab-${Date.now()}.json`,
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-muted-foreground text-sm">
        Export all your echotab data as a JSON file. This will include all your saved tabs and tags.
        You can import this data later to restore your echotab data.
      </div>
      <Button variant="outline" onClick={handleExport}>
        Export
      </Button>
    </div>
  );
}
