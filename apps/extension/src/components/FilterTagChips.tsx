import { useTagStore } from "../TagStore";
import { TagChipList } from "./TagChip";

interface Props {
  filter: {
    keywords?: string[];
    tags?: number[];
  };
  onRemoveKeyword?: (keyword: string) => void;
  onRemoveTag?: (tagId: number) => void;
}

export default function FilterTagChips({ filter, onRemoveKeyword, onRemoveTag }: Props) {
  const tagStore = useTagStore();

  return (
    <div className="flex items-center gap-5">
      {filter.keywords && filter.keywords.length > 0 && (
        <div className="text-foreground/75 flex items-center gap-2">
          Keywords:{" "}
          <TagChipList
            max={4}
            tags={filter.keywords.map((kw, i) => ({
              id: i,
              name: kw,
            }))}
            onRemove={onRemoveKeyword ? (t) => onRemoveKeyword(t.name!) : undefined}
          />
        </div>
      )}
      {filter.tags && filter.tags.length > 0 && (
        <div className="text-foreground/75 flex items-center gap-2">
          Tags:{" "}
          <TagChipList
            max={4}
            tags={filter.tags.map((t) => tagStore.tags.get(t)!)}
            onRemove={onRemoveTag ? (tag) => onRemoveTag(tag.id!) : undefined}
          />
        </div>
      )}
    </div>
  );
}
