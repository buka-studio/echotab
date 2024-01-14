import { Cross2Icon, DotsVerticalIcon, DragHandleDots2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

import useIsFirstRender from "../hooks/useIsFirstRender";
import { ActiveTab } from "../models";
import { SelectableItem, SelectableList } from "../SelectableList";
import SortableList, {
    DroppableContainer,
    SortableHandle,
    SortableItem,
    SortableOverlayItem,
} from "../SortableList";
import TabItem, { Favicon } from "../TabItem";
import TabListPlaceholder from "../TabsListPlaceholder";
import { TagChipList } from "../TagChip";
import { useTagStore } from "../TagStore";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/AlertDialog";
import { Badge } from "../ui/Badge";
import Button from "../ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { cn, focusSiblingItem } from "../util";
import ActiveCommand from "./ActiveCommand";
import ActiveStore, { useActiveTabStore } from "./ActiveStore";

export default function ActiveTabs() {
    const tabStore = useActiveTabStore();
    const tagStore = useTagStore();
    const isFirstRender = useIsFirstRender();

    const [tabIdsByWindowId, setTabIdsByWindowId] = useState(tabStore.viewTabIdsByWindowId);
    const prevFilteredIds = useRef(tabStore.viewTabIdsByWindowId);
    if (prevFilteredIds.current !== tabStore.viewTabIdsByWindowId) {
        prevFilteredIds.current = tabStore.viewTabIdsByWindowId;
        setTabIdsByWindowId(tabStore.viewTabIdsByWindowId);
    }

    const [activeId, setActiveId] = useState<number | null>(null);
    const activeIdRef = useRef(activeId);
    activeIdRef.current = activeId;

    const activeTab = tabStore.viewTabsById[activeId!];

    const hasTabs = tabStore.filteredTabIds.size > 0;
    const hasSelectedTabs = tabStore.selectedTabIds.size > 0;
    const hasDuplicates = tabStore.viewDuplicateTabIds.size > 0;

    return (
        <div className={cn("flex h-full flex-col", {})}>
            <div className="header sticky top-[20px] z-10">
                <ActiveCommand />
            </div>
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 py-2">
                <div className="ml-auto">
                    {hasSelectedTabs ? (
                        <Button variant="ghost" onClick={ActiveStore.deselectAllTabs}>
                            Deselect All
                        </Button>
                    ) : (
                        hasTabs && (
                            <Button variant="ghost" onClick={ActiveStore.selectAllTabs}>
                                Select All
                            </Button>
                        )
                    )}
                    {hasDuplicates && (
                        <Button variant="ghost" onClick={tabStore.removeDuplicateTabs}>
                            Close {tabStore.viewDuplicateTabIds.size} Duplicate(s)
                        </Button>
                    )}
                </div>
            </div>
            {tabStore.tabs.length === 0 && (
                <TabListPlaceholder
                    className="mt-12"
                    children={
                        <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                            <div className="text-balance text-lg">
                                Currently, there are no open tabs.
                            </div>
                            <div className="text-foreground/75 text-balance text-sm">
                                Open tabs will be displayed here.
                            </div>
                        </div>
                    }
                />
            )}
            <SelectableList
                onResetSelection={ActiveStore.deselectAllTabs}
                getSelected={() => ActiveStore.selectedTabIds}
                onSelectionChange={(selection) => ActiveStore.selectTabs(selection)}
                onBeforeStart={() => {
                    return activeIdRef.current === null;
                }}>
                <SortableList
                    selectedIds={Array.from(ActiveStore.selectedTabIds)}
                    items={tabIdsByWindowId}
                    onItemsChange={(items) => setTabIdsByWindowId(items)}
                    onSortEnd={(items) => tabStore.syncOrder(items)}
                    onActiveIdChange={setActiveId}>
                    {Object.entries(tabIdsByWindowId).map(([windowId, tabIds], i) => (
                        <div className="mx-auto mt-12 max-w-4xl select-none px-2" key={windowId}>
                            <div className="mb-2 flex justify-between">
                                <div className="inline-flex items-center gap-2 text-sm">
                                    Window {i + 1}{" "}
                                    <Badge variant="secondary">{tabIds.length}</Badge>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost">Close All</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will close all tabs in this window.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    tabStore.removeAllInWindow(Number(windowId))
                                                }>
                                                Close All
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <DroppableContainer id={windowId} asChild>
                                <ul
                                    onKeyDown={(e) => {
                                        if (activeId) {
                                            return;
                                        }
                                        focusSiblingItem(e, ".item-container");
                                    }}
                                    className={cn(
                                        "data-[over=true]:bg-muted/30 flex w-full flex-col gap-2 rounded-xl p-2",
                                    )}>
                                    {tabIds.map((tabId, j) => {
                                        const tab = tabStore.viewTabsById[tabId];
                                        if (!tab) {
                                            return null;
                                        }
                                        const tags = tabStore.selectedTabIds.has(tabId)
                                            ? Array.from(tabStore.assignedTagIds)
                                                  .map((id) => tagStore.tags.get(id)!)
                                                  .filter(Boolean)
                                            : [];

                                        return (
                                            <SelectableItem asChild id={tabId} key={tabId}>
                                                <motion.li
                                                    animate={{ opacity: 1 }}
                                                    transition={
                                                        isFirstRender
                                                            ? {
                                                                  type: "tween",
                                                                  delay:
                                                                      activeId === tabId
                                                                          ? 0
                                                                          : 0.02 * j,
                                                                  duration:
                                                                      activeId === tabId ? 0 : 0.5,
                                                              }
                                                            : {}
                                                    }
                                                    initial={{ opacity: 0 }}
                                                    className={cn(
                                                        "item-container select-none rounded-lg",
                                                    )}>
                                                    <SortableItem
                                                        id={tabId}
                                                        useHandle
                                                        asChild
                                                        disabled={tab.pinned}>
                                                        <TabItem
                                                            className={cn({
                                                                "bg-card-active border-border-active data-[is-dragged=true]:!opacity-20 data-[is-dragged=true]:blur-sm":
                                                                    tabStore.selectedTabIds.has(
                                                                        tabId,
                                                                    ),
                                                            })}
                                                            icon={
                                                                <SortableHandle asChild>
                                                                    <button
                                                                        className={cn(
                                                                            "handle focus-ring group relative cursor-grab rounded",
                                                                            {
                                                                                "pointer-events-none":
                                                                                    tab.pinned,
                                                                            },
                                                                        )}
                                                                        disabled={tab.pinned}>
                                                                        <Favicon
                                                                            src={tab.favIconUrl}
                                                                            className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                                                                        />
                                                                        <DragHandleDots2Icon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100" />
                                                                    </button>
                                                                </SortableHandle>
                                                            }
                                                            tab={tab}
                                                            additional={
                                                                <div className="flex gap-2">
                                                                    <TagChipList
                                                                        tags={tags}
                                                                        minimal
                                                                    />
                                                                    <TabMenu tab={tab} i={j} />
                                                                    <Button
                                                                        size="icon-sm"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            tabStore.removeTab(
                                                                                tabId,
                                                                            )
                                                                        }>
                                                                        <Cross2Icon className="h-5 w-5" />
                                                                    </Button>
                                                                </div>
                                                            }
                                                        />
                                                    </SortableItem>
                                                </motion.li>
                                            </SelectableItem>
                                        );
                                    })}
                                </ul>
                            </DroppableContainer>
                        </div>
                    ))}
                    <SortableOverlayItem>
                        {activeTab && (
                            <TabItem
                                tab={activeTab}
                                icon={<Favicon src={activeTab.favIconUrl} />}
                            />
                        )}
                    </SortableOverlayItem>
                </SortableList>
            </SelectableList>
        </div>
    );
}

function TabMenu({ tab, i }: { tab: ActiveTab; i: number }) {
    const tabStore = useActiveTabStore();

    const tabIdx = tabStore.viewTabIdsByWindowId[tab.windowId].findIndex((id) => id === tab.id);

    const handleCloseBefore = () => {
        tabStore.removeTabs(tabStore.viewTabIdsByWindowId[tab.windowId].slice(0, tabIdx));
    };

    const handleCloseAfter = () => {
        tabStore.removeTabs(tabStore.viewTabIdsByWindowId[tab.windowId].slice(i + 1));
    };

    const handleCloseOthers = () => {
        tabStore.removeTabs(
            tabStore.viewTabIdsByWindowId[tab.windowId].filter((id) => id !== tab.id),
        );
    };

    const handleTabSelection = () => {
        tabStore.toggleTabSelection(tab.id);
    };

    const handlePinTab = () => {
        tabStore.updateTab(tab.id, {
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
                <DropdownMenuItem onClick={handlePinTab}>
                    {tab.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTabSelection}>
                    {tabStore.selectedTabIds.has(tab.id) ? "Deselect" : "Select"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCloseBefore}>Close before</DropdownMenuItem>
                <DropdownMenuItem onClick={handleCloseAfter}>Close after</DropdownMenuItem>
                <DropdownMenuItem onClick={handleCloseOthers}>Close others</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
