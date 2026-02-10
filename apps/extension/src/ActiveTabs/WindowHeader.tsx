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
import { Button } from "@echotab/ui/Button";
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
import {
  tabStoreActions,
  useTabSelectionStore,
  useTabStore,
  useViewTabIdsByWindowId,
  useViewTabsById,
} from "../store/tabStore";
import { tagStoreActions } from "../store/tagStore";
import { pluralize } from "../util";
import { intersection } from "../util/set";

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
  className,
}: {
  window: {
    id: number;
    label: string;
  };
  actions?: ReactNode;
  className?: string;
}) {
  const tabs = useTabStore((s) => s.tabs);
  const activeWindowId = useTabStore((s) => s.activeWindowId);
  const selection = useTabSelectionStore();
  const viewTabIdsByWindowId = useViewTabIdsByWindowId();
  const viewTabsById = useViewTabsById();

  const windowTabIds = useMemo(() => {
    return tabs.filter((tab) => tab.windowId === window.id).map((tab) => tab.id);
  }, [tabs, window.id]);

  const viewTabIds = viewTabIdsByWindowId[window.id] ?? [];
  const selectedTabIds = intersection(new Set(selection.selectedTabIds), new Set(viewTabIds));
  const affectedTabIds = selectedTabIds.size ? Array.from(selectedTabIds) : viewTabIds;

  const closeLabel =
    affectedTabIds.length < windowTabIds.length
      ? `This action will close ${pluralize(affectedTabIds.length, "tab")} in this window.`
      : "This action will close all tabs in this window.";
  const ctaLabel = affectedTabIds.length < windowTabIds.length ? `Close` : "Close All";

  const handleQuickSave = () => {
    const tagName = tagStoreActions.getQuickSaveTagName();
    const [quickTag] = tagStoreActions.createTags([{ name: tagName, isQuick: true }]);

    if (!quickTag) return;

    const tabsToSave = affectedTabIds
      .map((id) => viewTabsById[id])
      .filter((tab): tab is NonNullable<typeof tab> => tab != null)
      .map((tab) => ({
        ...tab,
        tagIds: [quickTag.id],
      }));

    tabStoreActions.saveTabs(tabsToSave);
  };

  const isHighlighted =
    Object.keys(viewTabIdsByWindowId).length > 1 && window.id === activeWindowId;

  return (
    <div className={cn("flex justify-between", className)}>
      <div className="flex items-center select-none">
        <span className="mr-2 inline-flex items-center gap-2">
          <button
            className={cn(
              "text-muted-foreground focus-ring rounded-sm text-sm transition-colors duration-300",
              {
                "text-primary": isHighlighted,
              },
            )}
            onClick={() => tabStoreActions.focusWindow(window.id)}>
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
        <DropdownMenuContent side="bottom" align="end">
          {Boolean(selectedTabIds.size) && (
            <DropdownMenuLabel>Selected: {selectedTabIds.size}</DropdownMenuLabel>
          )}

          <DropdownMenuItem onSelect={() => handleQuickSave()}>Quick Save</DropdownMenuItem>
          <DropdownMenuSeparator />
          <CloseConfirmDialog
            onConfirm={() => tabStoreActions.removeTabs(affectedTabIds)}
            closeLabel={closeLabel}
            actionLabel={ctaLabel}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Close Tabs</DropdownMenuItem>
            </AlertDialogTrigger>
          </CloseConfirmDialog>

          <CloseConfirmDialog
            onConfirm={() => tabStoreActions.removeWindow(window.id)}
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
