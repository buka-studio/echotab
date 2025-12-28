import Button from "@echotab/ui/Button";
import { toast } from "@echotab/ui/Toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { ChangeEventHandler, DragEventHandler, useState } from "react";
import { z } from "zod";

import { getUtcISO } from "~/util/date";
import { normalizedComparator } from "~/util/string";

import { useBookmarkStore } from "../../Bookmarks";
import { Tag } from "../../models";
import TagStore, { unassignedTag, useTagStore } from "../../TagStore";
import { intersection } from "../../util/set";

const importHint = `\
Tag {
  id: number; 
  name: string; 
  color?: string; 
  favorite?: boolean;
  isQuick?: boolean;
  isAI?: boolean;
}

Tab {
  id: number;
  title: string;
  url: string;
  tagIds: number[];
  faviconUrl?: string;
  pinned?: boolean;
  savedAt?: string;
  visitedAt?: string;
  lastCuratedAt?: string;
  note?: string;
}

List {
  id: string;
  title: string;
  content: string;
  tabIds: string[];
  savedAt?: string;
  updatedAt?: string;
}

Import { 
  savedTabs: Tab[]; 
  tags: Tag[];
  lists?: List[];
}
`;

const schema = z.object({
  tags: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      color: z.string(),
      favorite: z.boolean().default(false),
      isQuick: z.boolean().default(false),
      isAI: z.boolean().default(false),
    }),
  ),
  tabs: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      url: z.string(),
      tagIds: z.array(z.number()),
      faviconUrl: z.string().optional(),
      pinned: z.boolean().optional(),
      savedAt: z.string().optional(),
      visitedAt: z.string().optional(),
      lastCuratedAt: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
  lists: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        content: z.string(),
        tabIds: z.array(z.string().uuid()),
        savedAt: z.string().optional(),
        updatedAt: z.string().optional(),
      }),
    )
    .optional(),
});

export default function DNDImport() {
  const tagStore = useTagStore();
  const bookmarkStore = useBookmarkStore();
  const [draggingOver, setDraggingOver] = useState(false);

  // todo: add tests for this
  const handleImport = async (file: File) => {
    try {
      const imported = JSON.parse(await file.text());
      const validated = schema.parse(imported);

      function remapTagIds(remappedIds: Map<number, number>) {
        if (!remappedIds.size) {
          return;
        }
        for (const t of validated.tabs) {
          if (intersection(remappedIds.keys(), t.tagIds).size) {
            t.tagIds = t.tagIds.map((id) => remappedIds.get(id) || id);
          }
        }

        for (const t of validated.tags) {
          if (remappedIds.has(t.id)) {
            t.id = remappedIds.get(t.id)!;
          }
        }
      }

      const tagsByNormalizedName = new Map<string, Tag>(
        validated.tags.map((t) => [t.name.trim().toLowerCase(), t]),
      );
      const duplicateNames = intersection(
        Array.from(TagStore.tagsByNormalizedName.keys()),
        Array.from(tagsByNormalizedName.keys()),
      );
      if (duplicateNames.size) {
        const remappedIds = new Map(
          Array.from(duplicateNames).flatMap((n) => {
            const from = tagsByNormalizedName.get(n)!.id;
            const to = TagStore.tagsByNormalizedName.get(n)!.id;
            if (from === to) {
              return [];
            }
            return [[from, to]];
          }),
        );

        remapTagIds(remappedIds);
      }

      const tagsById = new Map(validated.tags.map((t) => [Number(t.id), t]));
      const duplicateIds = intersection(TagStore.tags.keys(), tagsById.keys());
      duplicateIds.delete(unassignedTag.id);
      if (duplicateIds.size) {
        const startId = TagStore.getNextTagId();
        let i = 1;

        const remappedIds = new Map<number, number>(
          Array.from(duplicateIds).flatMap((id) => {
            const a = TagStore.tags.get(id)?.name;
            const b = tagsById.get(id)?.name;
            if (normalizedComparator(a, b) === 0) {
              return [];
            }

            return [[id, startId + i++]];
          }),
        );

        remapTagIds(remappedIds);
      }

      tagStore.import({
        tags: new Map(validated.tags.map((t) => [Number(t.id), t])),
      });

      bookmarkStore.import({
        tabs: validated.tabs.map((t) => ({ ...t, savedAt: getUtcISO() })),
      });

      toast.success("Imported tabs & tags successfully!");
    } catch (e) {
      toast.error("There was an error parsing the file");
      console.error(e);
    }
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    const files = Array.from(e.target?.files || []);
    if (files.length) {
      handleImport(files[0]);
      e.target.value = ""; // allow the user to select the same file again
    }
  };

  const handleDrop: DragEventHandler = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      handleImport(files[0]);
    }
  };

  const handleDragLeave: DragEventHandler = (e) => {
    e.preventDefault();
    setDraggingOver(false);
  };

  const handleDragOver: DragEventHandler = (e) => {
    e.preventDefault();
    setDraggingOver(true);
  };

  const handleImportBookmarks = async () => {
    const bookmarksRoot = await chrome.bookmarks.getTree();
    const bookmarks: { title: string; url: string; folders: string[] }[] = [];
    const folders: Set<string> = new Set();

    const traverseBookmarks = (node: chrome.bookmarks.BookmarkTreeNode, parents: string[]) => {
      if (!node) {
        return;
      }
      if (node.children) {
        node.children.forEach((child) =>
          traverseBookmarks(child, [...parents, node.title].filter(Boolean)),
        );
      } else if (node.url) {
        bookmarks.push({ title: node.title, url: node.url, folders: [...parents] });
        parents.forEach((p) => folders.add(p.trim()));
      }
    };

    bookmarksRoot.forEach((r) => traverseBookmarks(r, []));

    const tagsByName: Map<string, Tag> = new Map(
      Array.from(folders).map((f) => {
        if (!tagStore.tagsByNormalizedName.has(f)) {
          return [f, tagStore.createTag({ name: f })];
        }
        return [f, tagStore.tagsByNormalizedName.get(f)!];
      }),
    );

    const tabs = bookmarks.map((b) => ({
      title: b.title,
      url: b.url,
      tagIds: b.folders.map((f) => tagsByName.get(f)!.id),
    }));

    bookmarkStore.saveTabs(tabs);

    toast.success("Imported bookmarks successfully!");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">
          Import your bookmarks and create a tag for every folder.
        </div>
        <Button variant="outline" onClick={handleImportBookmarks}>
          Import bookmarks
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          Drop a file or click to upload a echotab JSON export.{" "}
          <Tooltip>
            <TooltipTrigger className="focus-visible:ring-ring flex rounded-full focus-visible:outline-none focus-visible:ring-1">
              <InfoCircledIcon />
            </TooltipTrigger>
            <TooltipContent
              onWheel={(e) => {
                e.stopPropagation();
              }}>
              <div className="overflow-auto">
                JSON Format shape:
                <div
                  className={cn(
                    "text-muted-foreground scrollbar-gray mt-3 max-h-[150px] overflow-auto whitespace-pre font-mono",
                  )}>
                  {importHint}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <input id="import" className="peer sr-only" type="file" onChange={handleChange} />
        <label
          htmlFor="import"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="group">
          <div
            className={cn(
              "peer-focus-visible:group-[]:border-primary hover:border-primary cursor-pointer rounded-md border border-dashed bg-opacity-10 p-10 text-center text-sm transition-all duration-200 hover:bg-opacity-10",
              { ["border-primary"]: draggingOver },
            )}>
            Drag & drop or click to upload
          </div>
        </label>
      </div>
    </div>
  );
}
