import Button from "@echotab/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandNotEmpty,
} from "@echotab/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@echotab/ui/Popover";
import { cn } from "@echotab/ui/util";
import { CheckIcon } from "@radix-ui/react-icons";
import { ReactNode, useMemo, useRef, useState } from "react";

import { Tag } from "~/src/models";
import { unassignedTag, useTagStore } from "~/src/TagStore";
import { toggle } from "~/src/util/set";

import TagChip from "./TagChip";

interface Props {
  tags: Partial<Tag>[];
  max?: number;
  expandable?: boolean;
  trigger?: ReactNode;
  onToggle?: (tag: Partial<Tag>) => void;
  onSetTags?: (tagIds: number[]) => void;
  onRemove?: (tag: Partial<Tag>) => void;
  editable?: boolean;
}

const exactMatchFilter = (value: string, search: string) => {
  if (value.toLowerCase().includes(search.toLowerCase())) {
    return 1;
  }

  return 0;
};

export default function TagChipCombobox({
  tags,
  max = 5,
  onRemove,
  onToggle,
  trigger,
  onSetTags,
  expandable = true,
  editable = true,
}: Props) {
  const visibleTags = Array.from(tags).slice(0, max);
  const excess = tags.length - max;

  const tagStore = useTagStore();

  const tagIdSet = new Set(tags.filter(Boolean).map((t) => t.id)) as Set<number>;

  const [selectedTagIds, setSelectedTagIds] = useState(tagIdSet);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const handleCreateTag = () => {
    const tag = tagStore.createTag({ name: search });
    setSelectedTagIds((tagIds) => {
      const wipSet = new Set(tagIds);
      toggle(wipSet, tag.id);

      return wipSet;
    });

    setSearch("");
  };

  const commandRef = useRef<HTMLDivElement>(null);

  const getValue = () => {
    const highlighted = commandRef.current?.querySelector(`[cmdk-item=""][aria-selected="true"]`);
    if (highlighted) {
      return (highlighted as HTMLElement)?.dataset?.value;
    }
  };

  const handleSave = () => {
    onSetTags?.(Array.from(selectedTagIds));
    setOpen(false);
  };

  const tagItems = useMemo(() => {
    return Array.from(tagStore.tags.values())
      .filter((t) => {
        if (t.id === unassignedTag.id) {
          return false;
        }

        if (editable) {
          return true;
        }

        return selectedTagIds.has(t.id);
      })
      .sort((a, b) => {
        const aSelected = selectedTagIds.has(a.id);
        const bSelected = selectedTagIds.has(b.id);

        if (aSelected && !bSelected) {
          return -1;
        }

        if (!aSelected && bSelected) {
          return 1;
        }

        return 0;
      });
  }, [tagStore.tags, selectedTagIds]);

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Popover
        open={open}
        onOpenChange={(open) => {
          setSelectedTagIds(tagIdSet);
          setOpen(open);
        }}>
        <PopoverTrigger asChild disabled={!expandable} onClick={() => setOpen(true)}>
          {trigger || (
            <button className="focus-ring m-[1px] flex items-center rounded">
              <div className="flex gap-1 p-1">
                {visibleTags.map((t) => (
                  <div
                    key={t.id}
                    style={{ backgroundColor: t.color }}
                    className="outline-card/80 h-5 w-2 rounded-full"
                  />
                ))}
              </div>
              {excess > 0 && <span className="pr-1">+{excess}</span>}
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto flex-col items-start gap-1 p-1"
          onWheel={(e) => {
            e.stopPropagation();
          }}>
          <Command
            loop
            filter={exactMatchFilter}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !getValue() && search) {
                e.preventDefault();
                handleCreateTag();
              } else if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                handleSave();
              }
            }}>
            {editable && (
              <CommandInput
                placeholder="Search tags..."
                className="px-2 py-1 text-sm"
                value={search}
                onValueChange={setSearch}
              />
            )}
            <CommandEmpty className="cursor-pointer py-3" onClick={() => handleCreateTag()}>
              {search ? (
                <span className="inline-flex gap-2">
                  Create <TagChip className="text-sm">{search}</TagChip>
                </span>
              ) : (
                "Type to create a tag"
              )}
            </CommandEmpty>
            <CommandList>
              <CommandGroup>
                {tagItems.map((tag) => (
                  <CommandItem
                    value={tag.name}
                    key={tag.id}
                    onSelect={() => {
                      setSelectedTagIds((tagIds) => {
                        const wipSet = new Set(tagIds);
                        toggle(wipSet, tag.id);

                        return wipSet;
                      });
                    }}
                    className="aria-selected:before:bg-transparent">
                    <div className="flex items-center gap-2">
                      {editable && (
                        <CheckIcon
                          className={cn("", {
                            "opacity-0": !selectedTagIds.has(tag.id),
                          })}
                        />
                      )}
                      <TagChip
                        color={tag.color}
                        onRemove={onRemove && (() => onRemove?.(tag))}
                        className="border-0">
                        {tag.name}
                      </TagChip>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {onSetTags && (
              <CommandNotEmpty>
                <Button
                  onClick={handleSave}
                  size="sm"
                  variant="outline"
                  className="relative mt-1 h-6 w-full gap-2">
                  <span>Save</span>
                  <span className="text-muted-foreground/60 absolute right-1">⌘ + enter</span>
                </Button>
              </CommandNotEmpty>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
