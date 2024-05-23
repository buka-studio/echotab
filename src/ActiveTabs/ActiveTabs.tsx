import {
    CaretSortIcon,
    Cross2Icon,
    DotsVerticalIcon,
    DragHandleDots2Icon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { ComponentProps, ComponentRef, forwardRef, useRef, useState } from "react";

import FilterTagChips from "../FilterTagChips";
import useIsFirstRender from "../hooks/useIsFirstRender";
import { ActiveTab } from "../models";
import { SelectableItem, SelectableList } from "../SelectableList";
import SortableList, {
    DroppableContainer,
    SortableHandle,
    SortableItem,
    SortableOverlayItem,
} from "../SortableList";
import SortButton from "../SortButton";
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
import { SortDir } from "../util/sort";
import ActiveCommand from "./ActiveCommand";
import ActiveStore, {
    SelectionStore,
    useActiveSelectionStore,
    useActiveTabStore,
    useIsTabSelected,
    usIsTabDuplicate,
} from "./ActiveStore";

function TabMenu({ tab, selected }: { tab: ActiveTab; selected: boolean }) {
    const getTabIndex = () =>
        ActiveStore.viewTabIdsByWindowId[tab.windowId].findIndex((id) => id === tab.id);

    const handleCloseBefore = () => {
        ActiveStore.removeTabs(
            ActiveStore.viewTabIdsByWindowId[tab.windowId].slice(0, getTabIndex()),
        );
    };

    const handleCloseAfter = () => {
        ActiveStore.removeTabs(
            ActiveStore.viewTabIdsByWindowId[tab.windowId].slice(getTabIndex() + 1),
        );
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
                <DropdownMenuItem onClick={handlePinTab}>
                    {tab.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
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

    const selected = useIsTabSelected(tab.id);
    const duplicate = usIsTabDuplicate(tab.id);

    const assignedTags = selected
        ? Array.from(assignedTagIds)
              .map((id) => tags.get(id)!)
              .filter(Boolean)
        : [];

    return (
        <TabItem
            {...rest}
            ref={ref}
            className={cn({ "border-border-active bg-card-active": selected }, className)}
            icon={
                <SortableHandle asChild>
                    <button
                        className={cn("handle focus-ring group relative cursor-grab rounded", {
                            "pointer-events-none": tab.pinned,
                        })}
                        disabled={tab.pinned}>
                        <Favicon
                            src={tab.url}
                            className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                        />
                        <DragHandleDots2Icon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100" />
                    </button>
                </SortableHandle>
            }
            tab={tab}
            link={
                <button
                    className="focus-ring overflow-hidden text-ellipsis whitespace-nowrap rounded-sm"
                    onClick={async () => {
                        await chrome.windows.update(tab.windowId, { focused: true });
                        await chrome.tabs.update(tab.id, { active: true });
                    }}>
                    {tab.url}
                </button>
            }
            actions={
                <div className="flex gap-2">
                    <TagChipList tags={assignedTags} minimal />
                    <TabMenu tab={tab} selected={selected} />
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => ActiveStore.removeTab(tab.id)}>
                        <Cross2Icon className="h-5 w-5" />
                    </Button>
                </div>
            }>
            {duplicate && <Badge variant="secondary">Duplicate</Badge>}
        </TabItem>
    );
});

function SelectButton() {
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

export default function ActiveTabs() {
    const tabStore = useActiveTabStore();
    const isFirstRender = useIsFirstRender();

    const [tabIdsByWindowId, setTabIdsByWindowId] = useState(tabStore.viewTabIdsByWindowId);
    const [windowsExpanded, setWindowsExpanded] = useState<Record<number, boolean>>(
        Object.fromEntries(
            Object.keys(tabStore.viewTabIdsByWindowId).map((id) => [Number(id), true]),
        ),
    );

    const prevFilteredIds = useRef(tabStore.viewTabIdsByWindowId);
    if (prevFilteredIds.current !== tabStore.viewTabIdsByWindowId) {
        prevFilteredIds.current = tabStore.viewTabIdsByWindowId;
        setTabIdsByWindowId(tabStore.viewTabIdsByWindowId);
        setWindowsExpanded((w) => {
            const wipWindows = { ...w };
            for (const id of Object.keys(tabStore.viewTabIdsByWindowId)) {
                const windowId = Number(id);
                if (wipWindows[windowId] === undefined) {
                    wipWindows[windowId] = true;
                }
            }

            for (const id of Object.keys(wipWindows)) {
                const windowId = Number(id);
                if (!tabStore.viewTabIdsByWindowId[windowId]) {
                    delete wipWindows[windowId];
                }
            }

            return wipWindows;
        });
    }

    const allCollapsed = Object.values(windowsExpanded).every((v) => !v);

    const toggleWindowsExpanded = (id: number) => {
        setWindowsExpanded((e) => ({
            ...e,
            [id]: !e[id],
        }));
    };

    const handleCollapseAll = () => {
        setWindowsExpanded(
            Object.fromEntries(Array.from(Object.keys(windowsExpanded)).map((id) => [id, false])),
        );
    };

    const handleExpandAll = () => {
        setWindowsExpanded(
            Object.fromEntries(Array.from(Object.keys(windowsExpanded)).map((id) => [id, true])),
        );
    };

    const [activeId, setActiveId] = useState<number | null>(null);
    const activeIdRef = useRef(activeId);
    activeIdRef.current = activeId;

    const activeTab = tabStore.viewTabsById[activeId!];

    const handleRemoveFilterKeyword = (keyword: string) => {
        tabStore.updateFilter({
            keywords: ActiveStore.view.filter.keywords.filter((kw) => kw !== keyword.trim()),
        });
    };

    const handleSort = () => {
        tabStore.setView({
            sort: {
                prop: "index",
                dir: tabStore.view.sort.dir === SortDir.Desc ? SortDir.Asc : SortDir.Desc,
            },
        });
    };

    const hasDuplicates = tabStore.viewDuplicateTabIds.size > 0;
    const hasTabs = tabStore.tabs.length > 0;

    return (
        <div className={cn("flex h-full flex-col", {})}>
            <div className="header sticky top-[20px] z-10 mx-auto flex w-full max-w-4xl">
                <ActiveCommand />
            </div>
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 py-2">
                {tabStore.filtersApplied && (
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" onClick={tabStore.clearFilter}>
                            Clear Filter
                        </Button>
                        <FilterTagChips
                            filter={tabStore.view.filter}
                            onRemoveKeyword={handleRemoveFilterKeyword}
                        />
                    </div>
                )}
                <div className="ml-auto">
                    <SelectButton />
                    {hasTabs &&
                        (allCollapsed ? (
                            <Button variant="ghost" onClick={handleExpandAll}>
                                Expand All
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={handleCollapseAll}>
                                Collapse All
                            </Button>
                        ))}
                    {hasDuplicates && (
                        <Button variant="ghost" onClick={ActiveStore.removeDuplicateTabs}>
                            Close {tabStore.viewDuplicateTabIds.size} Duplicate(s)
                        </Button>
                    )}
                </div>
            </div>
            <div className="mx-auto mb-2 mt-12 flex w-full max-w-4xl items-center justify-start">
                <div className="flex flex-1 items-center gap-2 text-sm">
                    <div className="flex gap-5">
                        <div className="flex items-center gap-2 text-sm">
                            Tab Order
                            <SortButton
                                active
                                dir={tabStore.view.sort.dir}
                                onClick={() => handleSort()}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {!hasTabs && (
                <TabListPlaceholder
                    className="mt-12"
                    children={
                        <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                            <div className="text-balance text-lg">
                                Currently, there are no open tabs.
                            </div>
                            <div className="text-balance text-sm text-foreground/75">
                                Open tabs will be displayed here.
                            </div>
                        </div>
                    }
                />
            )}
            <SelectableList
                onResetSelection={SelectionStore.deselectAllTabs}
                getSelected={() => SelectionStore.selectedTabIds}
                onSelectionChange={(selection) =>
                    SelectionStore.selectTabs(selection as Set<number>)
                }
                onBeforeStart={() => {
                    return activeIdRef.current === null;
                }}>
                <SortableList
                    getSelectedIds={() => SelectionStore.selectedTabIds}
                    items={tabIdsByWindowId}
                    onItemsChange={(items) => setTabIdsByWindowId(items)}
                    onSortEnd={(items) => tabStore.syncOrder(items)}
                    onActiveIdChange={setActiveId}>
                    {Object.entries(tabIdsByWindowId).map(([windowId, tabIds], i) => (
                        <div className="mx-auto mt-8 max-w-4xl select-none px-2" key={windowId}>
                            <div className="mb-2 flex justify-between">
                                <div className="inline-flex items-center gap-2 text-sm">
                                    Window {i + 1}{" "}
                                    <Badge variant="secondary">{tabIds.length}</Badge>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            toggleWindowsExpanded(Number(windowId));
                                        }}>
                                        {windowsExpanded[Number(windowId)] ? "Collapse" : "Expand"}
                                        <CaretSortIcon className="ml-2 h-4 w-4" />
                                    </Button>
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
                                                }
                                                variant="destructive">
                                                Close All
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            {windowsExpanded[Number(windowId)] && (
                                <DroppableContainer id={windowId} asChild>
                                    <ul
                                        onKeyDown={(e) => {
                                            if (activeId) {
                                                return;
                                            }
                                            focusSiblingItem(e, ".item-container");
                                        }}
                                        className={cn(
                                            "flex w-full flex-col gap-2 rounded-xl p-2 data-[over=true]:bg-muted/30",
                                        )}>
                                        {tabIds.map((tabId, j) => {
                                            const tab = tabStore.viewTabsById[tabId];
                                            if (!tab) {
                                                return null;
                                            }

                                            const isActive = activeId === tabId;

                                            return (
                                                <SelectableItem asChild id={tabId} key={tabId}>
                                                    <motion.li
                                                        animate={{ opacity: 1 }}
                                                        transition={
                                                            isFirstRender
                                                                ? {
                                                                      type: "tween",
                                                                      delay: isActive
                                                                          ? 0
                                                                          : 0.02 * j,
                                                                      duration: isActive ? 0 : 0.5,
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
                                                            disabled={tab.pinned}
                                                            asChild>
                                                            <div className="group/sortable">
                                                                <ActiveTabItem
                                                                    tab={tab}
                                                                    className="group-data-[is-dragged=true]/sortable:!opacity-20 group-data-[is-dragged=true]/sortable:blur-sm"
                                                                />
                                                            </div>
                                                        </SortableItem>
                                                    </motion.li>
                                                </SelectableItem>
                                            );
                                        })}
                                    </ul>
                                </DroppableContainer>
                            )}
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
