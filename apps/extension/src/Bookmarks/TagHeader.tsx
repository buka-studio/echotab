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
import { Button } from "@echotab/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

import TagChip from "../components/tag/TagChip";
import { Tag } from "../models";
import {
  bookmarkStoreActions,
  useBookmarkSelectionStore,
  useBookmarkStore,
  useFilteredTabsByTagId,
} from "../store/bookmarkStore";
import { useSettingStore } from "../store/settingStore";
import { unassignedTag, useTagsById } from "../store/tagStore";
import { formatLinks, pluralize } from "../util";
import { intersection } from "../util/set";

function UntagConfirmDialog({
  onConfirm,
  children,
  tag,
  affectedCount,
}: {
  onConfirm: () => void;
  children: ReactNode;
  tag: Tag;
  affectedCount: number;
}) {
  return (
    <AlertDialog>
      {children}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              This will remove{" "}
              <TagChip color={tag.color} className="inline-flex">
                {tag.name}
              </TagChip>{" "}
              from {pluralize(affectedCount, "bookmark")}.
            </div>
          </AlertDialogDescription>
          <div className="border-border text-muted-foreground mt-5 rounded border-t p-2 text-sm">
            Note: if there are no other tags left, the {pluralize(affectedCount, "bookmark")} will
            be tagged as{" "}
            <TagChip className="inline-flex" color="#000">
              Unassigned
            </TagChip>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Untag
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteConfirmDialog({
  onConfirm,
  children,
  affectedCount,
}: {
  affectedCount: number;
  onConfirm: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      {children}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {pluralize(affectedCount, "bookmark")} in this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function TagHeader({
  tag,
  actions,
  highlighted,
  className,
}: {
  tag: Tag;
  actions?: ReactNode;
  highlighted?: boolean;
  className?: string;
}) {
  const tabs = useBookmarkStore((s) => s.tabs);
  const tagsById = useTagsById();
  const selectionStore = useBookmarkSelectionStore();
  const { clipboardFormat } = useSettingStore((s) => s.settings);
  const filteredTabsByTagId = useFilteredTabsByTagId();

  if (!tagsById.has(Number(tag?.id))) {
    return null;
  }

  const tabIds = filteredTabsByTagId[tag?.id];
  if (!tabIds) {
    return null;
  }

  const selectedTabIds = intersection(selectionStore.selectedTabIds, tabIds);
  const affectedTabIds = new Set(selectedTabIds.size ? selectedTabIds : tabIds);
  const affectedLabel =
    selectedTabIds.size && selectedTabIds.size !== tabIds.length
      ? pluralize(affectedTabIds.size, "link")
      : "all links";

  const handleCopyToClipboard = () => {
    const selectedLinks = tabs.filter((tab) => affectedTabIds.has(tab.id));

    const linksWithTags = selectedLinks.map((tab) => ({
      title: tab.title,
      url: tab.url,
      tags: tab.tagIds.map((tagId) => tagsById.get(tagId)?.name ?? ""),
    }));

    const formatted = formatLinks(linksWithTags, clipboardFormat);

    navigator.clipboard
      .writeText(formatted)
      .then(() => {
        toast.success(`${pluralize(affectedTabIds.size, "link")} copied to clipboard`);
      })
      .catch(() => {
        toast.error("Failed to copy links to clipboard");
      });
  };

  const handleOpen = (newWindow?: boolean) => {
    const selectedLinks = tabs.filter((tab) => affectedTabIds.has(tab.id));
    const urls = selectedLinks.map((tab) => tab.url);
    if (newWindow) {
      chrome.windows.create({
        url: urls,
      });
      return;
    }
    return Promise.all(
      urls.map((url) =>
        chrome.tabs.create({
          url,
        }),
      ),
    );
  };

  return (
    <div className={cn("flex justify-between", className)}>
      <div className="flex items-center select-none">
        <span className="mr-2 inline-flex items-center gap-2">
          <span
            className={cn(
              "text-muted-foreground max-w-[30cqw] overflow-hidden text-sm text-ellipsis whitespace-nowrap transition-colors duration-300",
              {
                "text-primary": highlighted,
              },
            )}>
            {tagsById.get(Number(tag.id))?.name}
          </span>
          <Badge variant="card">{tabIds?.length}</Badge>
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
          <DropdownMenuItem onClick={handleCopyToClipboard}>Copy to clipboard</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleOpen()}>Open in this window</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpen(true)}>Open in new window</DropdownMenuItem>
          <DropdownMenuSeparator />
          <UntagConfirmDialog
            tag={tag}
            onConfirm={() => bookmarkStoreActions.removeTabsTag(tabIds, tag.id)}
            affectedCount={affectedTabIds.size}>
            {tag.id !== unassignedTag.id && (
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Untag{" "}
                  <TagChip color={tag.color} className="inline-flex">
                    {tag.name}
                  </TagChip>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            )}
          </UntagConfirmDialog>

          <DeleteConfirmDialog
            affectedCount={affectedTabIds.size}
            onConfirm={() => bookmarkStoreActions.removeTabs(tabIds)}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
            </AlertDialogTrigger>
          </DeleteConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
