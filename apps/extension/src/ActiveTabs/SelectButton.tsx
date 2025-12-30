import { Button } from "@echotab/ui/Button";

import { SelectionStore, useActiveSelectionStore, useActiveTabStore } from "./ActiveStore";

export default function SelectButton() {
  const { filteredTabIds } = useActiveTabStore();
  const { selectedTabIds } = useActiveSelectionStore();

  const hasTabs = filteredTabIds.size > 0;
  const hasSelectedTabs = selectedTabIds.size > 0;

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
