import { Button } from "@echotab/ui/Button";

import {
  tabStoreSelectionActions,
  useFilteredTabIds,
  useTabSelectionStore,
} from "../store/tabStore";

export default function SelectButton() {
  const filteredTabIds = useFilteredTabIds();
  const selectionStore = useTabSelectionStore();

  const hasTabs = filteredTabIds.size > 0;
  const hasSelectedTabs = selectionStore.selectedTabIds.size > 0;

  return (
    <>
      {hasSelectedTabs ? (
        <Button variant="ghost" onClick={tabStoreSelectionActions.deselectAllTabs}>
          Deselect All
        </Button>
      ) : (
        hasTabs && (
          <Button variant="ghost" onClick={tabStoreSelectionActions.selectAllTabs}>
            Select All
          </Button>
        )
      )}
    </>
  );
}
