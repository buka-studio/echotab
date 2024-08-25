import Button from "@echotab/ui/Button";

import { SelectionStore, useBookmarkSelectionStore, useBookmarkStore } from "./BookmarkStore";

export default function SelectButton() {
  const { filteredTabIds } = useBookmarkStore();
  const { selectedItemIds } = useBookmarkSelectionStore();

  const hasTabs = filteredTabIds.size > 0;
  const hasSelectedTabs = selectedItemIds.size > 0;

  return (
    <>
      {hasSelectedTabs ? (
        <Button variant="ghost" onClick={SelectionStore.deselectAllTabs}>
          Deselect All
        </Button>
      ) : (
        hasTabs && (
          <Button variant="ghost" onClick={SelectionStore.selectAllTabs}>
            Select All
          </Button>
        )
      )}
    </>
  );
}
