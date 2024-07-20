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
import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { InfoCircledIcon, TrashIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

import TagChip from "../components/TagChip";
import { Tag } from "../models";
import { unassignedTag, useTagStore } from "../TagStore";
import { pluralize } from "../util";
import { intersection } from "../util/set";
import { useBookmarkSelectionStore, useBookmarkStore } from "./BookmarkStore";

export default function TagHeader({
  tag,
  actions,
  highlighted,
}: {
  tag: Tag;
  actions?: ReactNode;
  highlighted?: boolean;
}) {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();
  const selection = useBookmarkSelectionStore();

  const tabIds = bookmarkStore.filteredTabsByTagId[tag?.id];
  const selectedTabIds = intersection(selection.selectedItemIds, tabIds);

  if (!tagStore.tags.has(Number(tag?.id))) {
    return null;
  }
  return (
    <div className="flex justify-between">
      <div className="select-none">
        <span className="mr-2 inline-flex items-center gap-2">
          <span
            className={cn(
              "text-muted-foreground max-w-[30cqw] overflow-hidden text-ellipsis whitespace-nowrap text-sm transition-colors duration-300",
              {
                "text-primary": highlighted,
              },
            )}>
            {tagStore.tags.get(Number(tag.id))!.name}
          </span>
          <Badge variant="card">{tabIds?.length}</Badge>
        </span>
        {actions}
      </div>
      <div className="flex items-center gap-2">
        {tag.id !== unassignedTag.id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="select-none">
                Untag
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    This will remove{" "}
                    <TagChip color={tag.color} className="inline-flex">
                      {tag.name}
                    </TagChip>{" "}
                    from{" "}
                    {pluralize(selectedTabIds.size ? selectedTabIds.size : tabIds.length, "tab")}.
                    <div className="border-border text-muted-foreground mt-5 rounded border border-dashed p-4">
                      <InfoCircledIcon className="mr-1 inline text-balance" /> Note: if there are no
                      other tags left, the tabs will be tagged as{" "}
                      <TagChip className="inline-flex">Unassigned</TagChip>.
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => bookmarkStore.removeTabsTag(tabIds, tag.id)}
                  variant="destructive">
                  Untag
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <ButtonWithTooltip
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground select-none"
              tooltipText="Delete Tabs">
              <TrashIcon className="h-5 w-5" />
            </ButtonWithTooltip>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all tabs in this group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => bookmarkStore.removeTabs(tabIds)}
                variant="destructive">
                Delete Tabs
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
