import { Cross2Icon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

import { Tag } from "./models";
import { Badge } from "./ui/Badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { ScrollArea, ScrollBar } from "./ui/ScrollArea";
import { cn } from "./util";

interface TagChipListProps {
    tags: Partial<Tag>[];
    max?: number;
    expandable?: boolean;
    onRemove?: (tag: Partial<Tag>) => void;
    minimal?: boolean;
}

export function TagChipList({
    tags,
    max = 3,
    onRemove,
    expandable = true,
    minimal = false,
}: TagChipListProps) {
    const visibleTag = Array.from(tags).slice(0, max);

    return (
        <div className="flex items-center gap-2 overflow-hidden">
            {!minimal && (
                <ScrollArea className="w-full">
                    <div className="flex items-center gap-2">
                        {visibleTag.map((tag) => (
                            <TagChip
                                key={tag.id}
                                color={tag.color}
                                onRemove={onRemove && (() => onRemove?.(tag))}>
                                {tag.name}
                            </TagChip>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}

            {tags.length > 0 &&
                (tags.length > max || minimal) &&
                (expandable || minimal ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="focus-ring m-1 rounded">
                                {minimal ? (
                                    <div className="flex gap-1 p-1">
                                        {tags.map((t) => (
                                            <div
                                                key={t.id}
                                                style={{ backgroundColor: t.color }}
                                                className="h-4 w-4 rounded-full outline outline-1 outline-card/80 [&:not(:first-child)]:-ml-2"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Badge variant="secondary" className="whitespace-nowrap">
                                        + {tags.length - max}
                                    </Badge>
                                )}
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
                ) : (
                    <Badge className="whitespace-nowrap" variant="secondary">
                        + {tags.length - max}
                    </Badge>
                ))}
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
                "flex max-w-[150px] items-center gap-1 rounded-md border bg-opacity-30 px-1 py-[2px] text-white grayscale-[0.3]",
                { "border-border bg-background text-foreground": !color },
                className,
            )}
            style={{ borderColor: "rgba(255,255,255,0.2)", background: color }}>
            <div className="label overflow-hidden text-ellipsis whitespace-nowrap text-xs uppercase">
                {children}
            </div>
            {onRemove && (
                <button className="focus-ring ml-2 rounded" onClick={onRemove}>
                    <Cross2Icon className="h-4 w-4 " />
                </button>
            )}
        </div>
    );
}
