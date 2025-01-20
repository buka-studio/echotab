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
} from "@echotab/ui/AlertDialog";
import Button from "@echotab/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { cn } from "@echotab/ui/util";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { ReactNode, useMemo } from "react";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import TagStore, { useTagStore } from "../TagStore";
import { pluralize } from "../util";
import { intersection } from "../util/set";
import ActiveStore, { useActiveSelectionStore, useActiveTabStore } from "./ActiveStore";

function CloseConfirmDialog({
  onConfirm,
  children,
  closeLabel,
  actionLabel,
}: {
  onConfirm: () => void;
  children: ReactNode;
  closeLabel: string;
  actionLabel: string;
}) {
  return (
    <AlertDialog>
      {children}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{closeLabel} </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function WindowHeader({
  window,
  actions,
}: {
  window: {
    id: number;
    label: string;
  };
  actions?: ReactNode;
}) {
  const tabStore = useActiveTabStore();
  const selection = useActiveSelectionStore();
  const tagStore = useTagStore();

  const windowTabIds = useMemo(() => {
    return tabStore.tabs.filter((tab) => tab.windowId === window.id).map((tab) => tab.id);
  }, [tabStore.tabs, window.id]);

  const viewTabIds = tabStore.viewTabIdsByWindowId[window.id];
  const selectedTabIds = intersection(selection.selectedTabIds, viewTabIds);
  const affectedTabIds = selectedTabIds.size ? Array.from(selectedTabIds) : viewTabIds;

  const closeLabel =
    affectedTabIds.length < windowTabIds.length
      ? `This action will close ${pluralize(affectedTabIds.length, "tab")} in this window.`
      : "This action will close all tabs in this window.";
  const ctaLabel = affectedTabIds.length < windowTabIds.length ? `Close` : "Close All";

  const handleQuickSave = () => {
    const tagName = TagStore.getQuickSaveTagName();
    const quickTag = tagStore.createTag({ name: tagName, isQuick: true });

    const tabsToSave = affectedTabIds
      .map((id) => ActiveStore.viewTabsById[id])
      .filter(Boolean)
      .map((tab) => {
        const tabToSave = {
          id: tab.id,
          url: tab.url,
          favIconUrl: tab?.favIconUrl,
          title: tab.title,
          savedAt: Date.now(),
          tagIds: [quickTag.id],
        };

        return tabToSave;
      });

    tabStore.saveTabs(tabsToSave);
  };

  return (
    <div className="flex justify-between px-1 pl-2 [&:not(:only-child)]:mb-4">
      <div className="flex select-none items-center">
        <span className="mr-2 inline-flex items-center gap-2">
          <button
            className={cn(
              "text-muted-foreground focus-ring rounded-sm text-sm transition-colors duration-300",
            )}
            onClick={() => tabStore.focusWindow(window.id)}>
            {window.label}
          </button>
          <AnimatedNumberBadge value={viewTabIds?.length} />
        </span>
        {actions}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="pointer-events-auto" variant="ghost" size="icon-sm">
            <DotsVerticalIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Boolean(selectedTabIds.size) && (
            <DropdownMenuLabel>Selected: {selectedTabIds.size}</DropdownMenuLabel>
          )}

          <DropdownMenuItem onSelect={() => handleQuickSave()}>Quick Save</DropdownMenuItem>
          <DropdownMenuSeparator />
          <CloseConfirmDialog
            onConfirm={() => tabStore.removeTabs(affectedTabIds)}
            closeLabel={closeLabel}
            actionLabel={ctaLabel}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Close Tabs</DropdownMenuItem>
            </AlertDialogTrigger>
          </CloseConfirmDialog>

          <CloseConfirmDialog
            onConfirm={() => tabStore.removeWindow(window.id)}
            closeLabel="This action will close this window and all tabs in it."
            actionLabel="Close Window">
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Close Window</DropdownMenuItem>
            </AlertDialogTrigger>
          </CloseConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
