import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { TagIcon } from "@phosphor-icons/react";
import { DrawingPinFilledIcon, DrawingPinIcon, TrashIcon } from "@radix-ui/react-icons";
import { ComponentProps, ComponentRef, forwardRef } from "react";

import SnapshotPreview from "../components/SnapshotPreview";
import TabItem, { Favicon } from "../components/TabItem";
import TagChipCombobox from "../components/tag/TagChipCombobox";
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

  const handleSetTags = (tagIds: number[]) => {
    BookmarkStore.tagTabs([tab.id], tagIds, true);
  };

  const isInTagGroup = Boolean(currentGroupTagId && currentGroupTagId !== unassignedTag.id);

  const currentGroupTag = tags.get(currentGroupTagId!);

  return (
    <TabItem
      data-selected={selected}
      ref={ref}
      className={cn({
        "border-border-active bg-card-active": selected,
      })}
      hideFavicon={hideBookmarkFavicons}
      linkPreview={<SnapshotPreview tab={{ id: tab.id, url: tab.url }} />}
      icon={
        <Favicon
          src={tab.url}
          className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
        />
      }
      link={
        <a
          className="cursor-pointer overflow-hidden rounded-sm text-ellipsis whitespace-nowrap hover:underline focus-visible:underline focus-visible:outline-none"
          target="_blank"
          href={tab.url}>
          {tab.url}
        </a>
      }
      tab={tab}
      actions={
        <div className="flex flex-row-reverse items-center @[200px]:flex-row @[200px]:gap-2">
          <TagChipCombobox
            tags={combinedTags.sort((a, b) => currentTagFirstComparator(a, b, currentGroupTagId))}
            onSetTags={handleSetTags}
          />
          <ButtonWithTooltip
            variant="ghost"
            size="icon-sm"
            side="top"
            tooltipText={tab.pinned ? "Unpin" : "Pin"}
            onClick={(e) => {
              BookmarkStore.togglePinTab(tab.id);
            }}>
            {tab.pinned ? (
              <DrawingPinFilledIcon className="h-5 w-5" />
            ) : (
              <DrawingPinIcon className="h-5 w-5" />
            )}
          </ButtonWithTooltip>
          {!tab.pinned && (
            <>
              {isInTagGroup && (
                <ButtonWithTooltip
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => BookmarkStore.removeTabTag(tab.id, currentGroupTagId!)}
                  side="top"
                  tooltipText={currentGroupTag ? `Untag "${currentGroupTag.name}"` : "Untag"}>
                  <TagIcon className="h-5 w-5" weight="fill" />
                </ButtonWithTooltip>
              )}
              <ButtonWithTooltip
                variant="ghost"
                size="icon-sm"
                onClick={() => BookmarkStore.removeTab(tab.id)}
                side="top"
                tooltipText="Remove">
                <TrashIcon className="h-5 w-5" />
              </ButtonWithTooltip>
            </>
          )}
        </div>
      }
      {...rest}
    />
  );
});

export default SavedTabItem;
