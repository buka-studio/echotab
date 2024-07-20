import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { DrawingPinFilledIcon, DrawingPinIcon, TrashIcon } from "@radix-ui/react-icons";
import { ComponentProps, ComponentRef, forwardRef } from "react";

import TabItem, { Favicon } from "../components/TabItem";
import { MinimalTagChipList } from "../components/TagChip";
import { SavedTab, Tag } from "../models";
import { unassignedTag, useTagStore } from "../TagStore";
import { useUIStore } from "../UIStore";
import BookmarkStore, { useBookmarkStore, useIsTabSelected } from "./BookmarkStore";

function currentTagFirstComparator(a: Partial<Tag>, b: Partial<Tag>, currentTagId?: number) {
  if (!currentTagId) {
    return 0;
  }

  if (a.id === currentTagId) {
    return -1;
  } else if (b.id === currentTagId) {
    return 1;
  }
  return 0;
}

type Props = ComponentProps<typeof TabItem> & { tab: SavedTab; currentGroupTagId?: number };
type Ref = ComponentRef<typeof TabItem>;

const SavedTabItem = forwardRef<Ref, Props>(function SavedTabItem(
  { tab, currentGroupTagId, ...rest },
  ref,
) {
  const { assignedTagIds } = useBookmarkStore();
  const { tags } = useTagStore();
  const {
    settings: { hideBookmarkFavicons },
  } = useUIStore();

  const selected = useIsTabSelected(tab.id);

  const combinedTags = Array.from(tab.tagIds)
    .concat(selected ? Array.from(assignedTagIds) : [])
    .map((id) => tags.get(id)!)
    .filter((t) => Number.isFinite(t?.id));

  const handleRemoveTag =
    tab.tagIds.length === 1 && tab.tagIds[0] === unassignedTag.id
      ? undefined
      : (tag: Partial<Tag>) => {
          BookmarkStore.removeTabTag(tab.id, tag.id!);
        };

  return (
    <TabItem
      data-selected={selected}
      ref={ref}
      className={cn({
        "border-border-active bg-card-active": selected,
      })}
      hideFavicon={hideBookmarkFavicons}
      icon={
        <Favicon
          src={tab.url}
          className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
        />
      }
      link={
        <a
          className="overflow-hidden text-ellipsis whitespace-nowrap rounded-sm focus-visible:underline focus-visible:outline-none"
          target="_blank"
          href={tab.url}>
          {tab.url}
        </a>
      }
      tab={tab}
      actions={
        <div className="@[200px]:flex-row @[200px]:gap-2 flex flex-row-reverse items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              BookmarkStore.togglePinTab(tab.id);
            }}>
            {tab.pinned ? (
              <DrawingPinFilledIcon className="h-5 w-5" />
            ) : (
              <DrawingPinIcon className="h-5 w-5" />
            )}
          </Button>
          <MinimalTagChipList
            tags={combinedTags.sort((a, b) => currentTagFirstComparator(a, b, currentGroupTagId))}
            onRemove={handleRemoveTag}
          />
          {!tab.pinned && (
            <Button variant="ghost" size="icon-sm" onClick={() => BookmarkStore.removeTab(tab.id)}>
              <TrashIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      }
      {...rest}
    />
  );
});

export default SavedTabItem;
