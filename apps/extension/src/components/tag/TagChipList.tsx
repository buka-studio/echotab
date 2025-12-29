import { Badge } from "@echotab/ui/Badge";
import { Popover, PopoverContent, PopoverTrigger } from "@echotab/ui/Popover";
import { ScrollArea, ScrollBar } from "@echotab/ui/ScrollArea";

import { Tag } from "~/models";

import TagChip from "./TagChip";

interface TagChipListProps {
  tags: Partial<Tag>[];
  max?: number;
  expandable?: boolean;
  onToggle?: (tag: Partial<Tag>) => void;
  onSetTags?: (tagIds: number[]) => void;
  onRemove?: (tag: Partial<Tag>) => void;
}

export default function TagChipList({
  tags,
  max = 3,
  onRemove,
  expandable = true,
}: TagChipListProps) {
  const visibleTags = Array.from(tags).slice(0, max);
  const excess = tags.length - max;

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2">
          {visibleTags.map((tag) => (
            <TagChip key={tag.id} color={tag.color} onRemove={onRemove && (() => onRemove?.(tag))}>
              {tag.name}
            </TagChip>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {excess > 0 && (
        <Popover>
          <PopoverTrigger asChild disabled={!expandable}>
            <button className="focus-ring m-px rounded">
              <Badge variant="secondary" className="whitespace-nowrap">
                + {tags.length - max}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent className="flex w-auto flex-col items-start gap-1">
            <div className="mb-2 text-sm">Tags</div>
            <div className="flex flex-col items-start gap-1">
              {tags.map((tag) => (
                <TagChip
                  key={tag.id}
                  color={tag.color}
                  onRemove={onRemove && (() => onRemove?.(tag))}>
                  {tag.name}
                </TagChip>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
