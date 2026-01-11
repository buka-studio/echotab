import { Badge } from "@echotab/ui/Badge";
import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import {
  Cross2Icon,
  DotsVerticalIcon,
  DragHandleDots2Icon,
  DrawingPinFilledIcon,
  ReloadIcon,
  SpeakerLoudIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentProps, Ref } from "react";

import SnapshotPreview from "../components/SnapshotPreview";
import { SortableHandle } from "../components/SortableList";
import TabItem, { Favicon } from "../components/TabItem";
import TagChipCombobox from "../components/tag/TagChipCombobox";
import { Waveform } from "../components/Waveform";
import { ActiveTab } from "../models";
import { useSettingStore } from "../store/settingStore";
import {
  tabStoreActions,
  useTabInfo,
  useTabStore,
  useViewTabIdsByWindowId,
} from "../store/tabStore";
import { useTagsById } from "../store/tagStore";

function TabMenu({ tab, selected }: { tab: ActiveTab; selected: boolean }) {
  const viewTabIdsByWindowId = useViewTabIdsByWindowId();

  const windowTabs = viewTabIdsByWindowId[tab.windowId] || [];

  const tabIndex = windowTabs.findIndex((id) => id === tab.id);

  const handleCloseBefore = () => {
    if (tabIndex === -1) return;
    tabStoreActions.removeTabs(windowTabs.slice(0, tabIndex));
  };

  const handleCloseAfter = () => {
    if (tabIndex === -1) return;
    tabStoreActions.removeTabs(windowTabs.slice(tabIndex + 1));
  };

  const handleCloseOthers = () => {
    tabStoreActions.removeTabs(windowTabs.filter((id) => id !== tab.id));
  };

  const handleTabSelection = () => {
    tabStoreActions.toggleSelectedTabId(tab.id);
  };

  const handlePinTab = () => {
    tabStoreActions.updateTab(tab.id, {
      pinned: !tab.pinned,
    });
  };

  const handleReloadTab = () => {
    tabStoreActions.reloadTab(tab.id);
  };

  const handleMuteTab = () => {
    tabStoreActions.updateTab(tab.id, {
      muted: !tab.muted,
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
        <DropdownMenuLabel>
          Last opened:{" "}
          <span className="text-xs tracking-normal [text-transform:initial]">
            {formatLastAccessed(tab.lastAccessed)} ago.
          </span>
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={handlePinTab}>{tab.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
        <DropdownMenuItem onClick={handleTabSelection}>
          {selected ? "Deselect" : "Select"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Close tabs</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleCloseBefore}>Close tabs before</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCloseAfter}>Close tabs after</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCloseOthers}>Close other tabs</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleReloadTab}>
          Reload <ReloadIcon className="text-muted-foreground ml-auto hidden h-3 w-3" />{" "}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMuteTab}>
          {tab.muted ? "Unmute" : "Mute"}{" "}
          <SpeakerLoudIcon className="text-muted-foreground ml-auto hidden h-3 w-3" />{" "}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatLastAccessed(lastAccessed: number | undefined) {
  if (!lastAccessed) {
    return "never";
  }
  return formatDistanceToNow(new Date(lastAccessed));
}

function ActiveTabItem({
  tab,
  className,
  ref,
  ...rest
}: ComponentProps<typeof TabItem> & { tab: ActiveTab; ref: Ref<HTMLDivElement> }) {
  const assignedTagIds = useTabStore((s) => s.assignedTagIds);
  const tags = useTagsById();
  const hideFavicons = useSettingStore((s) => s.settings.hideFavicons);

  const { selected, duplicate, stale } = useTabInfo(tab.id);

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
    tabStoreActions.updateTab(tab.id, {
      pinned: !tab.pinned,
    });
  };

  const handleCloseTab = () => {
    tabStoreActions.removeTab(tab.id, { notify: true });
  };

  return (
    <TabItem
      {...rest}
      ref={ref}
      className={cn({ "border-border-active bg-card-active": selected }, className)}
      linkPreview={<SnapshotPreview url={tab.url} onVisit={handleFocusTab} />}
      icon={
        // todo: clean up
        tab.pinned ? (
          <button className={cn("focus-ring group relative rounded")} onClick={handleUnpinTab}>
            {!hideFavicons && (
              <Favicon
                src={tab.url}
                className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
              />
            )}
            <DrawingPinFilledIcon
              className={cn(
                "absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
                {
                  "text-muted-foreground hover:text-foreground relative opacity-100": hideFavicons,
                },
              )}
            />
          </button>
        ) : (
          <SortableHandle asChild>
            <button className={cn("handle focus-ring group relative cursor-grab rounded")}>
              {!hideFavicons && (
                <Favicon
                  src={tab.url}
                  className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                />
              )}
              <DragHandleDots2Icon
                className={cn(
                  "absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
                  {
                    "text-muted-foreground hover:text-foreground relative opacity-100":
                      hideFavicons,
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
          className="focus-ring cursor-pointer overflow-hidden rounded-sm text-ellipsis whitespace-nowrap hover:underline"
          onClick={handleFocusTab}>
          {tab.url}
        </button>
      }
      actions={
        <div className="flex items-center gap-2">
          <TagChipCombobox tags={assignedTags} />
          <TabMenu tab={tab} selected={selected} />
          <ButtonWithTooltip
            size="icon-sm"
            variant="ghost"
            tooltipText="Close Tab"
            onClick={handleCloseTab}>
            <Cross2Icon className="h-5 w-5" />
          </ButtonWithTooltip>
        </div>
      }>
      <div className="flex items-center gap-1">
        {duplicate && <Badge variant="card">Duplicate</Badge>}
        {stale && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="card">Stale</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last visited: {formatLastAccessed(tab.lastAccessed)} ago.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <AnimatePresence>
          {tab.audible && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(5px)" }}
              transition={{ duration: 0.2 }}>
              <Waveform bars={10} playing={!tab.muted} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TabItem>
  );
}

export default ActiveTabItem;
