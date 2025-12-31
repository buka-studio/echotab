import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { HeartIcon, PaletteIcon } from "@phosphor-icons/react";
import React, { useMemo, useRef, useState } from "react";

import { BookmarkStore, useBookmarkStore } from "../../Bookmarks";
import SortButton from "../../components/SortButton";
import { Tag } from "../../models";
import TagStore, { unassignedTag, useTagStore } from "../../TagStore";
import { SortDir } from "../../util/sort";
import { SettingsContent, SettingsPage, SettingsTitle } from "../SettingsLayout";
import TagControl from "./TagControl";

interface TagSetting extends Tag {
  tabCount: number;
}

const sortableColumns = ["favorite", "tabCount", "name"] as const;
type Column = (typeof sortableColumns)[number];

const columnLabels: Record<Column, string> = {
  favorite: "Favorite",
  tabCount: "# Tabs",
  name: "Name",
};

function propComparator<T extends { name: string; tabCount: number; favorite: boolean }>(
  a: T,
  b: T,
  prop: "tabCount" | "name" | "favorite",
): number {
  if (prop === "tabCount") {
    return a[prop] - b[prop];
  }
  if (prop === "favorite") {
    return Number(a[prop] ?? 0) - Number(b[prop] ?? 0);
  }
  return a[prop].localeCompare(b[prop]);
}

export default function TagsPage() {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();

  const [tagSort, setTagSort] = useState<{ col: (typeof sortableColumns)[number]; dir: SortDir }>({
    col: "tabCount",
    dir: SortDir.Desc,
  });

  const handleSort = (col: (typeof sortableColumns)[number]) => {
    if (tagSort.col === col) {
      setTagSort({ col, dir: tagSort.dir === SortDir.Desc ? SortDir.Asc : SortDir.Desc });
    } else {
      setTagSort({ col, dir: SortDir.Desc });
    }
  };

  const tagSettings: TagSetting[] = useMemo(() => {
    const tabCountsById = new Map(
      Array.from(tagStore.tags.values()).map((t) => [t.id, { ...t, tabCount: 0 }]),
    );
    for (const tab of bookmarkStore.tabs) {
      for (const tagId of tab.tagIds) {
        if (!tabCountsById.has(tagId)) {
          continue;
        }
        tabCountsById.get(tagId)!.tabCount += 1;
      }
    }

    const sorted = Array.from(tabCountsById.values()).sort((a, b) => {
      const tags = tagSort.dir === SortDir.Desc ? ([b, a] as const) : ([a, b] as const);
      return propComparator(...tags, tagSort.col);
    });
    return sorted;
  }, [tagStore.tags, bookmarkStore.tabs, tagSort]);

  const handleDeleteTag = (tag: Tag) => {
    BookmarkStore.removeTags([tag.id]);
    TagStore.deleteTag(tag.id);

    toast.success("Tag deleted");
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handleAddTag = () => {
    const tag = TagStore.createTag({ name: `Tag ${tagStore.tags.size + 1}` });
    setTimeout(() => {
      // todo: do via ref
      contentRef?.current?.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });

      const input = contentRef.current?.querySelector(
        `input[value="${tag.name}"`,
      ) as HTMLInputElement;

      input?.focus();
      input?.select();
    });
  };

  const handleShuffleTagColors = () => {
    TagStore.shuffleTagColors();
  };

  return (
    <SettingsPage>
      <SettingsTitle
        className="flex items-center"
        right={
          <Button variant="outline" onClick={handleAddTag} className="ml-auto">
            Add new tag
          </Button>
        }>
        Tags
      </SettingsTitle>

      <SettingsContent>
        <div className="grid w-full grid-cols-[20%_20%_auto] content-center items-center gap-3 gap-y-4">
          {sortableColumns.map((c, i) => (
            <div className="text-muted-foreground flex items-center gap-2 text-sm" key={c}>
              {columnLabels[c]}{" "}
              <SortButton
                active={tagSort.col === c}
                dir={tagSort.dir}
                onClick={() => handleSort(c)}
              />
              {i === sortableColumns.length - 1 && (
                <ButtonWithTooltip
                  onClick={handleShuffleTagColors}
                  size="icon-sm"
                  className="mr-[42px] ml-auto"
                  variant="ghost"
                  tooltipText="Shuffle tag colors">
                  <PaletteIcon size={18} />
                </ButtonWithTooltip>
              )}
            </div>
          ))}
          {tagSettings.map((t) => (
            <React.Fragment key={t.id}>
              <Button
                className="mr-auto"
                variant="ghost"
                size="icon-sm"
                aria-label={`Favorite ${t.name}`}
                onClick={() => TagStore.toggleTagFavorite(t.id)}>
                <HeartIcon
                  className={cn("size-4", { "text-red-500": t.favorite })}
                  weight={t.favorite ? "fill" : "regular"}
                />
              </Button>
              <span className="">{t.tabCount}</span>
              <TagControl
                tag={t}
                tabCount={t.tabCount}
                onChange={(update) => TagStore.updateTag(t.id, update)}
                onDelete={() => handleDeleteTag(t)}
                disabled={t.id === unassignedTag.id}
              />
            </React.Fragment>
          ))}
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
