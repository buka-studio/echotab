import { cn } from "@echotab/ui/util";

import { Tag } from "../models";
import { useTagStore } from "../TagStore";
import { useSavedTabStore } from "./SavedStore";

interface Props {
    visibleTagIds: Set<number>;
    onTagClick: ({ tag, index }: { tag: Tag; index: number }) => void;
    className?: string;
}

export default function TagNavigationLinks({ visibleTagIds, onTagClick, className }: Props) {
    const tagStore = useTagStore();
    const tabStore = useSavedTabStore();
    const tags = tabStore.viewTagIds.map((id) => tagStore.tags.get(id)!);

    return (
        <ul className={cn("flex flex-col gap-2 py-1 pl-2", className)}>
            {tags.map((tag, i) => {
                return (
                    <li
                        key={tag.id}
                        className={cn(
                            "text-foreground/50 text-sm leading-4 transition-all duration-200 [.favorite_+_&:not(.favorite)]:mt-5",
                            {
                                "text-foreground -translate-x-1": visibleTagIds.has(tag.id),
                                favorite: tag.favorite,
                            },
                        )}>
                        <button
                            className="focus-ring flex w-full select-none items-center gap-1 truncate rounded text-left"
                            onClick={() => onTagClick({ tag, index: i })}>
                            {tag?.name}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
