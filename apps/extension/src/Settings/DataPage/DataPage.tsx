import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@echotab/ui/AlertDialog";
import { Button } from "@echotab/ui/Button";
import { FileUpload, FileUploadDropzone } from "@echotab/ui/FileUpload";
import { Label } from "@echotab/ui/Label";
import { Separator } from "@echotab/ui/Separator";
import { toast } from "@echotab/ui/Toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { InfoCircledIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { z } from "zod";

import { CurateStore } from "~/Curate";
import { downloadJSON } from "~/util";
import { getUtcISO } from "~/util/date";
import { getBookmarks } from "~/util/import";
import SnapshotStore from "~/util/SnapshotStore";
import { normalizedComparator } from "~/util/string";

import { BookmarkStore, useBookmarkStore } from "../../Bookmarks";
import { Tag } from "../../models";
import TagStore, { unassignedTag, useTagStore } from "../../TagStore";
import { intersection } from "../../util/set";
import { SettingsContent, SettingsPage, SettingsTitle } from "../SettingsLayout";

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

export default function DataPage() {
  const tagStore = useTagStore();
  const bookmarkStore = useBookmarkStore();

  const [error, setError] = useState<string | null>(null);

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

  const handleImportBookmarks = async () => {
    const { bookmarks, folders } = await getBookmarks();

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

  const handleExport = () => {
    downloadJSON(
      {
        tabs: bookmarkStore.tabs,
        tags: Array.from(tagStore.tags.values()).filter((t) => t.id !== unassignedTag.id),
        lists: bookmarkStore.lists,
      },
      `echotab-${Date.now()}.json`,
    );
  };

  const handleConfirmDelete = async () => {
    BookmarkStore.removeAllItems();
    TagStore.deleteAllTags();
    CurateStore.removeAllItems();

    const snapshotStore = await SnapshotStore.init();
    await snapshotStore.clearSnapshots().catch(() => {
      toast.error("Failed to delete snapshots");
    });
  };

  return (
    <SettingsPage>
      <SettingsTitle>Data</SettingsTitle>
      <SettingsContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label htmlFor="import-bookmarks">Import bookmarks</Label>
            <div className="text-muted-foreground text-sm">
              Import your bookmarks and create a tag for every folder.
            </div>
          </div>
          <Button variant="outline" onClick={handleImportBookmarks}>
            Import <UploadSimpleIcon className="ml-2" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <Label htmlFor="import">
              JSON Import{" "}
              <Tooltip>
                <TooltipTrigger className="focus-visible:ring-ring flex rounded-full focus-visible:ring-1 focus-visible:outline-none">
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
                        "text-muted-foreground scrollbar-gray mt-3 max-h-[150px] overflow-auto font-mono whitespace-pre",
                      )}>
                      {importHint}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              Drop a file or click to upload an Echotab JSON export.{" "}
            </div>
          </div>

          <FileUpload
            onChange={(files) => {
              setError(null);
              handleImport(files[0]!);
            }}
            onReject={(files) => {
              const cause = files[0]?.cause.message;
              if (cause) {
                setError(cause);
              }
            }}
            accept="application/json"
            maxFiles={1}>
            <FileUploadDropzone className="group">
              <div className="flex flex-col items-center gap-2 p-8">
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-muted-foreground text-sm">Drag & drop or click to upload.</p>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
            </FileUploadDropzone>
          </FileUpload>
        </div>
        <Separator />

        <div className="flex items-center justify-between gap-2">
          <div>
            <Label htmlFor="export">Export Data</Label>
            <div className="text-muted-foreground text-sm">
              Export all your echotab data as a JSON file.
            </div>
          </div>
          <Button variant="outline" onClick={handleExport}>
            Export <DownloadSimpleIcon className="ml-2" />
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label htmlFor="delete">Delete Data</Label>
            <div className="text-muted-foreground text-sm">Delete all your echotab data.</div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Delete <TrashIcon className="ml-2" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all your saved tabs and tags from this computer. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} variant="destructive">
                  Delete Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
