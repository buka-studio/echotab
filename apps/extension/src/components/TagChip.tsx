import { Badge } from "@echotab/ui/Badge";
import { Popover, PopoverContent, PopoverTrigger } from "@echotab/ui/Popover";
import { ScrollArea, ScrollBar } from "@echotab/ui/ScrollArea";
import { cn } from "@echotab/ui/util";
import { Cross2Icon } from "@radix-ui/react-icons";
import { CSSProperties, ReactNode } from "react";

import { Tag } from "../models";

interface TagChipListProps {
  tags: Partial<Tag>[];
  max?: number;
  expandable?: boolean;
  onRemove?: (tag: Partial<Tag>) => void;
}

export function MinimalTagChipList({
  tags,
  max = 5,
  onRemove,
  expandable = true,
}: TagChipListProps) {
  const visibleTags = Array.from(tags).slice(0, max);
  const excess = tags.length - max;

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Popover>
        <PopoverTrigger asChild disabled={!expandable}>
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
    </div>
  );
}

export function TagChipList({ tags, max = 3, onRemove, expandable = true }: TagChipListProps) {
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
            <button className="focus-ring m-[1px] rounded">
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

interface TagChipProps {
  children: ReactNode;
  onRemove?(): void;
  className?: string;
  color?: string;
}

export default function TagChip({ children, onRemove, className = "", color }: TagChipProps) {
  return (
    <div
      className={cn(
        "relative flex max-w-[150px] items-center overflow-hidden rounded-full border bg-opacity-30 py-[2px] pl-[0.625rem] pr-[0.5rem] text-white grayscale-[0.3] transition-colors duration-150 before:pointer-events-none before:absolute before:inset-0 before:z-[-1] before:bg-[--color-bg] dark:text-[--color] dark:before:bg-[--color-bg-dark]",
        {
          "border-border bg-background text-foreground": !color,
          "pr-[0.25rem]": onRemove,
        },
        className,
      )}
      style={
        {
          borderColor: `color-mix(in hsl, ${color}, white 10%)`,
          "--color-bg-dark": `color-mix(in hsl, ${color}, transparent 70%)`,
          "--color": `color-mix(in hsl, ${color}, white 70%)`,
          "--color-bg": color,
        } as CSSProperties
      }>
      <div className="label overflow-hidden text-ellipsis whitespace-nowrap text-xs transition-colors duration-150">
        {children}
      </div>
      {onRemove && (
        <button
          className="focus-ring ml-1 rounded-full focus-visible:ring-white"
          onClick={onRemove}>
          <Cross2Icon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
