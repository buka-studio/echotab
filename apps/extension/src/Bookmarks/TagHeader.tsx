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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { DotsVerticalIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

import TagChip from "../components/TagChip";
import { Tag } from "../models";
import { unassignedTag, useTagStore } from "../TagStore";
import { useUIStore } from "../UIStore";
import { formatLinks, pluralize } from "../util";
import { intersection } from "../util/set";
import { useBookmarkSelectionStore, useBookmarkStore } from "./BookmarkStore";

function UntagConfirmDialog({
  onConfirm,
  children,
  tag,
  tabCount,
}: {
  onConfirm: () => void;
  children: ReactNode;
  tag: Tag;
  tabCount: number;
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
              from {pluralize(tabCount, "tab")}.
              <div className="border-border text-muted-foreground mt-5 rounded border border-dashed p-4">
                <InfoCircledIcon className="mr-1 inline text-balance" /> Note: if there are no other
                tags left, the tabs will be tagged as{" "}
                <TagChip className="inline-flex">Unassigned</TagChip>.
              </div>
            </div>
          </AlertDialogDescription>
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
}: {
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
            This will permanently delete all tabs in this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete Tabs
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
}: {
  tag: Tag;
  actions?: ReactNode;
  highlighted?: boolean;
}) {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();
  const selection = useBookmarkSelectionStore();
  const uiStore = useUIStore();

  if (!tagStore.tags.has(Number(tag?.id))) {
    return null;
  }

  const tabIds = bookmarkStore.filteredTabsByTagId[tag?.id];
  const selectedTabIds = intersection(selection.selectedItemIds, tabIds);
  const affectedTabIds = new Set(selectedTabIds.size ? selectedTabIds : tabIds);
  const affectedLabel = selectedTabIds.size ? pluralize(affectedTabIds.size, "tab") : "All";

  const handleCopyToClipboard = () => {
    const selectedLinks = bookmarkStore.tabs.filter((tab) => affectedTabIds.has(tab.id));

    const linksWithTags = selectedLinks.map((tab) => ({
      title: tab.title,
      url: tab.url,
      tags: tab.tagIds.map((tagId) => tagStore.tags.get(tagId)!.name),
    }));

    const formatted = formatLinks(linksWithTags, uiStore.settings.clipboardFormat);

    navigator.clipboard
      .writeText(formatted)
      .then(() => {
        toast(`Copied ${affectedTabIds.size} links to clipboard!`);
      })
      .catch(() => {
        toast("Failed to copy links to clipboard!");
      });
  };

  const handleOpen = (newWindow?: boolean) => {
    const selectedLinks = bookmarkStore.tabs.filter((tab) => affectedTabIds.has(tab.id));
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="pointer-events-auto" variant="ghost" size="icon-sm">
            <DotsVerticalIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleCopyToClipboard}>Copy to clipboard</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleOpen()}>Open in this window</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpen(true)}>Open in new window</DropdownMenuItem>
          <DropdownMenuSeparator />
          <UntagConfirmDialog
            tag={tag}
            onConfirm={() => bookmarkStore.removeTabsTag(tabIds, tag.id)}
            tabCount={affectedTabIds.size}>
            {tag.id !== unassignedTag.id && (
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Untag {affectedLabel}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            )}
          </UntagConfirmDialog>

          <DeleteConfirmDialog onConfirm={() => bookmarkStore.removeTabs(tabIds)}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Delete {affectedLabel}
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DeleteConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
