import { Button } from "@echotab/ui/Button";

import {
  bookmarkStoreSelectionActions,
  useBookmarkSelectionStore,
  useFilteredTabIds,
} from "../store/bookmarkStore";

export default function SelectButton() {
  const filteredTabIds = useFilteredTabIds();
  const selectionStore = useBookmarkSelectionStore();

  const hasTabs = filteredTabIds.size > 0;
  const hasSelectedTabs = selectionStore.selectedTabIds.size > 0;

  return (
    <>
      {hasSelectedTabs ? (
        <Button variant="ghost" onClick={bookmarkStoreSelectionActions.deselectAllTabs}>
          Deselect All
        </Button>
      ) : (
        hasTabs && (
          <Button variant="ghost" onClick={bookmarkStoreSelectionActions.selectAllTabs}>
            Select All
          </Button>
        )
      )}
    </>
  );
}
