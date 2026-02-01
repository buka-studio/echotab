import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@echotab/ui/Table";
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { BroomIcon, HeartIcon, PaintBucketIcon, PlusIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";

import { bookmarkStoreActions, useBookmarkStore } from "~/store/bookmarkStore";
import { tagStoreActions, useTagsById } from "~/store/tagStore";

import SortButton from "../../components/SortButton";
import { Tag } from "../../models";
import { SortDir } from "../../util/sort";
import { SettingsContent, SettingsPage, SettingsTitle } from "../SettingsLayout";
import TagColorPicker from "./TagColorPicker";
import TagDeleteButton from "./TagDeleteButton";
import { TagNameInput } from "./TagNameInput";

interface TagSetting extends Tag {
  tabCount: number;
}

const sortableColumns = ["favorite", "tabCount", "name"] as const;

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

export default function TagsPage({ contentClassName }: { contentClassName?: string }) {
  const tabs = useBookmarkStore((s) => s.tabs);
  const tagsById = useTagsById();

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
      Array.from(tagsById.values()).map((t) => [t.id, { ...t, tabCount: 0 }]),
    );
    for (const tab of tabs) {
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
  }, [tagsById, tabs, tagSort]);

  const handleDeleteTag = (tag: Tag) => {
    bookmarkStoreActions.removeTags([tag.id]);
    tagStoreActions.deleteTag(tag.id);

    toast.success("Tag deleted");
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handleAddTag = () => {
    const tag = tagStoreActions.createTags([{ name: `Tag ${tagsById.size + 1}` }]);
    setTimeout(() => {
      // todo: do via ref
      contentRef?.current?.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });

      const input = contentRef.current?.querySelector(
        `input[value="${tag[0]?.name}"`,
      ) as HTMLInputElement;

      input?.focus();
      input?.select();
    });
  };

  const handleShuffleTagColors = () => {
    tagStoreActions.shuffleTagColors();
  };

  const unusedTagIds = useMemo(() => {
    return bookmarkStoreActions.getUnusedTagIds();
  }, [tagsById]);

  const handleCleanupUnusedTags = () => {
    const unusedTagIds = bookmarkStoreActions.getUnusedTagIds();

    tagStoreActions.deleteTags(unusedTagIds);

    if (unusedTagIds.length) {
      toast.success(`${unusedTagIds.length} unused tags deleted`);
    }
  };

  return (
    <SettingsPage>
      <SettingsTitle
        className="flex items-center"
        right={
          <div className="flex items-center gap-2">
            <ButtonWithTooltip
              tooltipText="Cleanup unused tags"
              variant="outline"
              onClick={handleCleanupUnusedTags}
              disabled={unusedTagIds.length === 0}
              size="icon">
              <BroomIcon />
            </ButtonWithTooltip>
            <Button variant="outline" onClick={handleAddTag} className="ml-auto" >
              <PlusIcon className="mr-2" /> New tag
            </Button>
          </div>
        }>
        Tags
      </SettingsTitle>

      <SettingsContent className={contentClassName}>
        <Table containerClassName="overflow-initial">
          <TableCaption className="sr-only">A list of your tags.</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-auto text-center">
                <div className="flex items-center justify-center">
                  <PaintBucketIcon className="size-4" />
                </div>
              </TableHead>
              <TableHead className="h-auto">
                <SortButton
                  active={tagSort.col === "name"}
                  dir={tagSort.dir}
                  onClick={() => handleSort("name")}>
                  Name
                </SortButton>
              </TableHead>

              <TableHead className="h-auto text-right">
                <SortButton
                  active={tagSort.col === "tabCount"}
                  dir={tagSort.dir}
                  onClick={() => handleSort("tabCount")}>
                  Tab count
                </SortButton>
              </TableHead>
              <TableHead className="h-auto text-center"></TableHead>

              <TableHead className="h-auto"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagSettings.map((t) => (
              <TableRow key={t.id} className="hover:bg-transparent">
                <TableCell className="text-center">
                  <TagColorPicker
                    value={t.color}
                    onChange={(color) => tagStoreActions.updateTag(t.id, { color })}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <TagNameInput
                      key={t.name}
                      name={t.name}
                      onChange={(name) => tagStoreActions.updateTag(t.id, { name })}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="pr-4">{t.tabCount}</div>
                </TableCell>

                <TableCell className="text-center">
                  <ButtonWithTooltip
                    side="top"
                    tooltipText={t.favorite ? "Remove from favorites" : "Add to favorites"}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Favorite ${t.name}`}
                    onClick={() => tagStoreActions.toggleTagFavorite(t.id)}>
                    <HeartIcon
                      className={cn("size-4", { "text-red-500": t.favorite })}
                      weight={t.favorite ? "fill" : "regular"}
                    />
                  </ButtonWithTooltip>
                </TableCell>

                <TableCell>
                  <TagDeleteButton
                    tag={t}
                    onDelete={() => handleDeleteTag(t)}
                    tabCount={t.tabCount}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsContent>
    </SettingsPage>
  );
}
