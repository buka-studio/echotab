import { Button } from "@echotab/ui/Button";
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
import { motion } from "framer-motion";
import { ReactNode, useMemo, useRef, useState } from "react";

import { Tag } from "~/models";
import { tagStoreActions, unassignedTag, useTagStore } from "~/store/tagStore";
import { toggle } from "~/util/set";

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

const getDelay = (index: number, targetIndex: number, baseDelay = 0.1) => {
  const distance = Math.abs(index - targetIndex);
  return distance * baseDelay;
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

  const tagIdSet = new Set(
    tags.filter((t) => Boolean(t.id) && t.id !== unassignedTag.id).map((t) => t.id),
  ) as Set<number>;

  const [selectedTagIds, setSelectedTagIds] = useState(tagIdSet);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const handleCreateTag = () => {
    const tag = tagStoreActions.createTags([{ name: search }]);
    setSelectedTagIds((tagIds) => {
      const wipSet = new Set(tagIds);
      toggle(wipSet, tag[0]?.id);

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
    return Array.from(tagStore.tags.values()).filter((t) => {
      if (t.id === unassignedTag.id) {
        return false;
      }

      if (editable) {
        return true;
      }

      return selectedTagIds.has(t.id);
    });
  }, [tagStore.tags, selectedTagIds]);

  const atLeastOneChecked = selectedTagIds.size > 0;

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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
            <button className="focus-ring m-px flex items-center rounded">
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
              <>
                <CommandInput
                  placeholder="Search tags..."
                  className="px-2 py-1 text-sm"
                  value={search}
                  onValueChange={setSearch}
                />
                <hr className="absolute inset-x-0 top-8" />{" "}
              </>
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
            <CommandList className="scroll-fade overscroll-contain">
              <CommandGroup className={cn("px-0", { "py-0": !editable })}>
                {tagItems.map((tag, i) => {
                  const checked = editable && atLeastOneChecked;

                  const delay = getDelay(i, lastSelectedIndex ?? 0, 0.015);

                  return (
                    <CommandItem
                      value={tag.name}
                      key={tag.id}
                      onSelect={() => {
                        setSelectedTagIds((tagIds) => {
                          const wipSet = new Set(tagIds);
                          toggle(wipSet, tag.id);

                          setLastSelectedIndex(i);

                          return wipSet;
                        });
                      }}
                      className="min-h-auto aria-selected:before:bg-transparent">
                      <div className="flex items-center gap-2">
                        {checked && (
                          <CheckIcon
                            className={cn("absolute h-4 w-4", {
                              "opacity-0": !selectedTagIds.has(tag.id),
                            })}
                          />
                        )}
                        <motion.div
                          animate={{ x: checked ? 24 : 0 }}
                          transition={{ duration: 0.125, delay }}>
                          <TagChip
                            color={tag.color}
                            onRemove={onRemove && (() => onRemove?.(tag))}
                            className="border-0">
                            {tag.name}
                          </TagChip>
                        </motion.div>
                        <div className="w-6" />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            {onSetTags && (
              <CommandNotEmpty>
                <Button
                  onClick={handleSave}
                  size="sm"
                  variant="outline"
                  className="relative h-6 w-full gap-2 rounded-sm">
                  <span>Save</span>
                  {/* <span className="text-muted-foreground/60 absolute right-1">⌘ + enter</span> */}
                </Button>
              </CommandNotEmpty>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
