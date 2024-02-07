import { ChangeEventHandler, DragEventHandler, useState } from "react";
import { z } from "zod";

import { Tag } from "../../models";
import { useSavedTabStore } from "../../SavedTabs";
import TagStore, { useTagStore } from "../../TagStore";
import Button from "../../ui/Button";
import { toast } from "../../ui/Toast";
import { cn } from "../../util";
import { intersection } from "../../util/set";

const importHint = `\
Tab {                   Tag {
  id: number;             id: number;
  title: string;          name: string;
  url: string;            color?: string;
  tagIds: number[];       favorite?: boolean;
}                       }

Import { 
    savedTabs: Tab[]; 
    tags: Tag[];
}
`;

const schema = z.object({
    tags: z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            color: z.string(),
            favorite: z.boolean().default(false),
        }),
    ),
    tabs: z.array(
        z.object({
            id: z.string().uuid(),
            title: z.string(),
            url: z.string(),
            tagIds: z.array(z.number()),
        }),
    ),
});

export default function DNDImport() {
    const tagStore = useTagStore();
    const savedStore = useSavedTabStore();
    const [draggingOver, setDraggingOver] = useState(false);

    // todo: add tests for this
    const handleImport = async (file: File) => {
        try {
            const imported = JSON.parse(await file.text());
            const validated = schema.parse(imported);

            const tagsByName = new Map<string, Tag>(validated.tags.map((t) => [t.name.trim(), t]));

            function remapTagIds(remappedIds: Map<number, number>) {
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

            const duplicateNames = intersection(
                Array.from(TagStore.tags.values()).map((t) => t.name.trim()),
                validated.tags.map((t) => t.name.trim()),
            );
            if (duplicateNames.size) {
                const remappedIds = new Map(
                    Array.from(duplicateNames).map((n) => [
                        tagsByName.get(n)!.id,
                        TagStore.tagsByName.get(n)!.id,
                    ]),
                );

                remapTagIds(remappedIds);
            }

            const tagsById = new Map(validated.tags.map((t) => [Number(t.id), t]));
            const duplicateIds = intersection(TagStore.tags.keys(), tagsById.keys());
            if (duplicateIds.size) {
                const startId = TagStore.getNextTagId();
                let i = 1;

                const remappedIds = new Map<number, number>(
                    Array.from(duplicateIds).map((id) => [id, startId + i++]),
                );

                remapTagIds(remappedIds);
            }

            tagStore.import({
                tags: new Map(validated.tags.map((t) => [Number(t.id), t])),
            });

            savedStore.import({ tabs: validated.tabs });

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
                if (!tagStore.tagsByName.has(f)) {
                    return [f, tagStore.createTag(f)];
                }
                return [f, tagStore.tagsByName.get(f)!];
            }),
        );

        const tabs = bookmarks.map((b) => ({
            title: b.title,
            url: b.url,
            tagIds: b.folders.map((f) => tagsByName.get(f)!.id),
        }));

        savedStore.saveTabs(tabs);

        toast.success("Imported bookmarks successfully!");
    };

    return (
        <div className="flex flex-col gap-8 p-1">
            <Button variant="outline" onClick={handleImportBookmarks}>
                Import bookmarks
            </Button>
            <div className="flex flex-col gap-2">
                <div>Drop a file or click to upload a CmdTab JSON export.</div>
                <input id="import" className="peer sr-only" type="file" onChange={handleChange} />
                <label
                    htmlFor="import"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="group">
                    <div
                        className={cn(
                            "cursor-pointer whitespace-pre rounded-md border border-dashed bg-opacity-10 p-4 pl-6 font-mono text-muted-foreground transition-all duration-200 peer-focus-visible:group-[]:border-primary hover:border-primary hover:bg-opacity-10",
                            { ["border-primary"]: draggingOver },
                        )}>
                        {importHint}
                    </div>
                </label>
            </div>
        </div>
    );
}
