import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { cn } from "@echotab/ui/util";
import {
  Cross2Icon,
  DotsVerticalIcon,
  DragHandleDots2Icon,
  DrawingPinFilledIcon,
} from "@radix-ui/react-icons";
import { ComponentProps, ComponentRef, forwardRef } from "react";

import { SortableHandle } from "../components/SortableList";
import TabItem, { Favicon } from "../components/TabItem";
import { MinimalTagChipList } from "../components/TagChip";
import { ActiveTab } from "../models";
import { useTagStore } from "../TagStore";
import { useUIStore } from "../UIStore";
import ActiveStore, {
  SelectionStore,
  useActiveTabStore,
  useIsTabDuplicate,
  useIsTabSelected,
} from "./ActiveStore";

function TabMenu({ tab, selected }: { tab: ActiveTab; selected: boolean }) {
  const getTabIndex = () =>
    ActiveStore.viewTabIdsByWindowId[tab.windowId].findIndex((id) => id === tab.id);

  const handleCloseBefore = () => {
    ActiveStore.removeTabs(ActiveStore.viewTabIdsByWindowId[tab.windowId].slice(0, getTabIndex()));
  };

  const handleCloseAfter = () => {
    ActiveStore.removeTabs(ActiveStore.viewTabIdsByWindowId[tab.windowId].slice(getTabIndex() + 1));
  };

  const handleCloseOthers = () => {
    ActiveStore.removeTabs(
      ActiveStore.viewTabIdsByWindowId[tab.windowId].filter((id) => id !== tab.id),
    );
  };

  const handleTabSelection = () => {
    SelectionStore.toggleSelected(tab.id);
  };

  const handlePinTab = () => {
    ActiveStore.updateTab(tab.id, {
      pinned: !tab.pinned,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <DotsVerticalIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handlePinTab}>{tab.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
        <DropdownMenuItem onClick={handleTabSelection}>
          {selected ? "Deselect" : "Select"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCloseBefore}>Close before</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCloseAfter}>Close after</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCloseOthers}>Close others</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ActiveTabItem = forwardRef<
  ComponentRef<typeof TabItem>,
  ComponentProps<typeof TabItem> & { tab: ActiveTab }
>(function ActiveTabItem({ tab, className, ...rest }, ref) {
  const { assignedTagIds } = useActiveTabStore();
  const { tags } = useTagStore();
  const {
    settings: { hideTabsFavicons },
  } = useUIStore();

  const selected = useIsTabSelected(tab.id);
  const duplicate = useIsTabDuplicate(tab.id);

  const assignedTags = selected
    ? Array.from(assignedTagIds)
        .map((id) => tags.get(id)!)
        .filter(Boolean)
    : [];

  const handleFocusTab = async () => {
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tab.id, { active: true });
  };

  const handleUnpinTab = () => {
    ActiveStore.updateTab(tab.id, {
      pinned: !tab.pinned,
    });
  };

  const handleCloseTab = () => {
    ActiveStore.removeTab(tab.id);
  };

  return (
    <TabItem
      {...rest}
      ref={ref}
      className={cn({ "border-border-active bg-card-active": selected }, className)}
      icon={
        // todo: clean up
        tab.pinned ? (
          <button className={cn("focus-ring group relative rounded")} onClick={handleUnpinTab}>
            {!hideTabsFavicons && (
              <Favicon
                src={tab.url}
                className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
              />
            )}
            <DrawingPinFilledIcon
              className={cn(
                "absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
                {
                  "text-muted-foreground hover:text-foreground relative opacity-100":
                    hideTabsFavicons,
                },
              )}
            />
          </button>
        ) : (
          <SortableHandle asChild>
            <button className={cn("handle focus-ring group relative cursor-grab rounded")}>
              {!hideTabsFavicons && (
                <Favicon
                  src={tab.url}
                  className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                />
              )}
              <DragHandleDots2Icon
                className={cn(
                  "absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
                  {
                    "text-muted-foreground hover:text-foreground relative opacity-100":
                      hideTabsFavicons,
                  },
                )}
              />
            </button>
          </SortableHandle>
        )
      }
      tab={tab}
      link={
        <button
          className="focus-ring overflow-hidden text-ellipsis whitespace-nowrap rounded-sm"
          onClick={handleFocusTab}>
          {tab.url}
        </button>
      }
      actions={
        <div className="flex items-center gap-2">
          <MinimalTagChipList tags={assignedTags} />
          <TabMenu tab={tab} selected={selected} />
          <Button size="icon-sm" variant="ghost" aria-label="Close Tab" onClick={handleCloseTab}>
            <Cross2Icon className="h-5 w-5" />
          </Button>
        </div>
      }>
      {duplicate && <Badge variant="card">Duplicate</Badge>}
    </TabItem>
  );
});

export default ActiveTabItem;
