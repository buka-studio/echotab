import { TagChipList } from "../TagChip";
import { useTagStore } from "../TagStore";
import { Filter } from "./SavedStore";

interface Props {
    filter: Filter;
    onRemoveKeyword: (keyword: string) => void;
    onRemoveTag: (tagId: number) => void;
}

export default function FilterTagChips({ filter, onRemoveKeyword, onRemoveTag }: Props) {
    const tagStore = useTagStore();

    return (
        <div className="flex items-center gap-5">
            {filter.keywords.length > 0 && (
                <div className="text-foreground/75 flex items-center gap-2">
                    Keywords:{" "}
                    <TagChipList
                        max={4}
                        tags={filter.keywords.map((kw, i) => ({
                            id: i,
                            name: kw,
                        }))}
                        onRemove={(t) => onRemoveKeyword(t.name!)}
                    />
                </div>
            )}
            {filter.tags.length > 0 && (
                <div className="text-foreground/75 flex items-center gap-2">
                    Tags:{" "}
                    <TagChipList
                        max={4}
                        tags={filter.tags.map((t) => tagStore.tags.get(t)!)}
                        onRemove={(tag) => onRemoveTag(tag.id!)}
                    />
                </div>
            )}
        </div>
    );
}
