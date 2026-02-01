import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { Input } from "@echotab/ui/Input";
import { cn } from "@echotab/ui/util";
import { TagIcon } from "@phosphor-icons/react";
import {
  DrawingPinFilledIcon,
  DrawingPinIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { ComponentProps } from "react";

import TagChip from "~/components/tag/TagChip";

import TabItem, { Favicon } from "../components/TabItem";
import TagChipCombobox from "../components/tag/TagChipCombobox";
import { SavedTab, Tag } from "../models";
import { bookmarkStoreActions, useIsTabSelected } from "../store/bookmarkStore";
import { useSettingStore } from "../store/settingStore";
import { unassignedTag, useTagsById } from "../store/tagStore";

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

type Props = Omit<ComponentProps<typeof TabItem>, "tab"> & {
  tab: SavedTab;
  currentGroupTagId?: number;
};

function SavedTabItem({ currentGroupTagId, tab, ...rest }: Props) {
  const tagsById = useTagsById();
  const hideFavicons = useSettingStore((s) => s.settings.hideFavicons);

  const selected = useIsTabSelected(tab?.id);

  const combinedTags = Array.from(tab.tagIds)
    .map((id) => tagsById.get(id)!)
    .filter((t) => Number.isFinite(t?.id));

  const handleSetTags = (tagIds: number[]) => {
    bookmarkStoreActions.tagTabs([tab.id], tagIds, true);
  };

  const isInTagGroup = Boolean(currentGroupTagId && currentGroupTagId !== unassignedTag.id);

  const currentGroupTag = tagsById.get(currentGroupTagId!);

  const [editing, setEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (value: string) => {
    bookmarkStoreActions.updateTab(tab.id, {
      title: value,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setEditing(false);
      const value = inputRef.current?.value.trim() || tab.title;
      handleTitleChange(value);
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  return (
    <TabItem
      data-selected={selected}
      className={cn({
        "border-border-active bg-card-active": selected,
      })}
      title={
        <>
          {editing ? (
            <Input
              key="input"
              className="focus-visible:border-input hover:border-input bg-card! light:bg-card! field-sizing-content h-7 rounded border-none! border-transparent px-2 py-1 text-sm shadow-none! transition-all outline-none! not-focus-visible:bg-transparent! focus-visible:ring-0! starting:pl-0"
              ref={(e) => {
                inputRef.current = e;

                inputRef.current?.focus();
                inputRef.current?.select();
              }}
              defaultValue={String(tab.title)}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                setEditing(false);
                handleTitleChange(e.target.value.trim() || tab.title);
              }}
            />
          ) : (
            <span key="value" className="truncate">
              {tab.title}
            </span>
          )}
        </>
      }
      hideFavicon={hideFavicons}
      icon={
        <button
          className={cn("handle focus-ring group relative cursor-pointer rounded")}
          onClick={() => setEditing(true)}>
          {!hideFavicons && (
            <Favicon
              src={tab.url}
              className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
            />
          )}

          <span
            className={cn(
              "absolute top-1/2 left-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
              {
                "text-muted-foreground hover:text-foreground relative opacity-100": hideFavicons,
              },
            )}>
            <Pencil1Icon className="size-5" />
          </span>
        </button>
      }
      link={
        <a
          className="cursor-pointer overflow-hidden rounded-sm text-ellipsis whitespace-nowrap hover:underline focus-visible:underline focus-visible:outline-none"
          target="_blank"
          rel="noreferrer"
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
              bookmarkStoreActions.togglePinTab(tab.id);
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
                  onClick={() => bookmarkStoreActions.removeTabTag(tab.id, currentGroupTagId!)}
                  side="top"
                  tooltipContent={
                    currentGroupTag ? (
                      <div className="flex items-center gap-2">
                        Untag{" "}
                        <TagChip
                          color={currentGroupTag.color}
                          className="border-0 px-0"
                          indicatorClassName="size-3">
                          {currentGroupTag.name}
                        </TagChip>
                      </div>
                    ) : (
                      "Untag"
                    )
                  }
                  tooltipText={currentGroupTag ? `Untag "${currentGroupTag.name}"` : "Untag"}>
                  <TagIcon className="h-5 w-5" weight="fill" />
                </ButtonWithTooltip>
              )}
              <ButtonWithTooltip
                variant="ghost"
                size="icon-sm"
                onClick={() => bookmarkStoreActions.removeTab(tab.id)}
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
}

export default SavedTabItem;
