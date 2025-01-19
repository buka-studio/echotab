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
import { useState } from "react";

import { Tag } from "~/src/models";
import { unassignedTag, useTagStore } from "~/src/TagStore";
import { toggle } from "~/src/util/set";

import TagChip from "./TagChip";

interface Props {
  tags: Partial<Tag>[];
  max?: number;
  expandable?: boolean;
  onToggle?: (tag: Partial<Tag>) => void;
  onSetTags?: (tagIds: number[]) => void;
  onRemove?: (tag: Partial<Tag>) => void;
  editable?: boolean;
}

export default function TagChipCombobox({
  tags,
  max = 5,
  onRemove,
  onToggle,
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

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Popover
        open={open}
        onOpenChange={(open) => {
          setSelectedTagIds(tagIdSet);
          setOpen(open);
        }}>
        <PopoverTrigger asChild disabled={!expandable} onClick={() => setOpen(true)}>
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
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col items-start gap-1 p-1">
          <Command>
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
                {Array.from(tagStore.tags.values())
                  .filter((t) => t.id !== unassignedTag.id)
                  .filter((t) => {
                    if (editable) {
                      return true;
                    }

                    return selectedTagIds.has(t.id);
                  })
                  .map((tag) => (
                    <CommandItem
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
                  onClick={() => {
                    onSetTags?.(Array.from(selectedTagIds));
                    setOpen(false);
                  }}
                  size="sm"
                  variant="outline"
                  className="mt-3 h-6 w-full">
                  Save
                </Button>
              </CommandNotEmpty>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
