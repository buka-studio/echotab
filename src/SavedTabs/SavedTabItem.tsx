import { Cross2Icon, DrawingPinFilledIcon, DrawingPinIcon } from "@radix-ui/react-icons";
import { ComponentProps, ComponentRef, forwardRef } from "react";

import { SavedTab, Tag } from "../models";
import TabItem, { Favicon } from "../TabItem";
import { TagChipList } from "../TagChip";
import { unassignedTag, useTagStore } from "../TagStore";
import Button from "../ui/Button";
import { cn } from "../util";
import SavedStore, { useIsTabSelected, useSavedTabStore } from "./SavedStore";

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

const SavedTabItem = forwardRef<
    ComponentRef<typeof TabItem>,
    ComponentProps<typeof TabItem> & { tab: SavedTab; currentGroupTagId?: number }
>(function SavedTabItem({ tab, currentGroupTagId, ...rest }, ref) {
    const { assignedTagIds } = useSavedTabStore();
    const { tags } = useTagStore();

    const selected = useIsTabSelected(tab.id);

    const combinedTags = Array.from(tab.tagIds)
        .concat(selected ? Array.from(assignedTagIds) : [])
        .map((id) => tags.get(id)!)
        .filter((t) => Number.isFinite(t?.id));

    const handleRemoveTag =
        tab.tagIds.length === 1 && tab.tagIds[0] === unassignedTag.id
            ? undefined
            : (tag: Partial<Tag>) => {
                  SavedStore.removeTabTag(tab.id, tag.id!);
              };

    return (
        <TabItem
            ref={ref}
            className={cn({
                "border-border-active bg-card-active": selected,
            })}
            icon={
                <Favicon
                    src={tab.url}
                    className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                />
            }
            link={
                <a
                    className="focus-ring overflow-hidden text-ellipsis whitespace-nowrap rounded-sm"
                    target="_blank"
                    href={tab.url}>
                    {tab.url}
                </a>
            }
            tab={tab}
            actions={
                <div className="flex flex-row-reverse @[200px]:flex-row @[200px]:gap-2">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            SavedStore.togglePinTab(tab.id);
                        }}>
                        {tab.pinned ? (
                            <DrawingPinFilledIcon className="h-5 w-5" />
                        ) : (
                            <DrawingPinIcon className="h-5 w-5" />
                        )}
                    </Button>
                    <TagChipList
                        minimal
                        tags={combinedTags.sort((a, b) =>
                            currentTagFirstComparator(a, b, currentGroupTagId),
                        )}
                        onRemove={handleRemoveTag}
                    />
                    {!tab.pinned && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => SavedStore.removeTab(tab.id)}>
                            <Cross2Icon className="h-5 w-5 " />
                        </Button>
                    )}
                </div>
            }
            {...rest}
        />
    );
});

export default SavedTabItem;
