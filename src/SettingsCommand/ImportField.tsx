import { ChangeEventHandler, DragEventHandler, useState } from "react";
import { z } from "zod";

import { useSavedTabStore } from "../SavedTabs";
import TagStore, { useTagStore } from "../TagStore";
import { toast } from "../ui/Toast";
import { cn } from "../util";
import { intersection } from "../util/set";

const importHint = `\
Tab {                 Tag {
  id: number;           id: number;
  title: string;        name: string;
  url: string;        }
  tags: number[];
}                           

Import { 
    savedTabs: Record<number, Tab>; 
    tags: Record<number, Tag>;
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
            id: z.number(),
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

    const handleImport = async (file: File) => {
        try {
            const imported = JSON.parse(await file.text());

            imported.tabs = Object.values(imported.tabs);

            const validated = schema.parse(imported);

            const existingTags = intersection(
                TagStore.tags.keys(),
                validated.tags.map((t) => t.id),
            );
            if (existingTags.size) {
                toast.error(`Tags with IDs ${Array.from(existingTags).join(", ")} already exist`);
                return;
            }

            if ("tags" in validated) {
                tagStore.import({
                    tags: new Map(validated.tags.map((t) => [Number(t.id), t])),
                });
            }
            if ("tabs" in imported) {
                savedStore.import({ tabs: validated.tabs });
            }
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

    return (
        <div className="">
            <label
                htmlFor="import"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}>
                <div
                    className={cn(
                        "hover:border-primary text-muted-foreground cursor-pointer whitespace-pre rounded-md border border-dashed bg-opacity-10 p-4 pl-6 font-mono transition-all duration-200 hover:bg-opacity-10",
                        { ["border-primary"]: draggingOver },
                    )}>
                    {importHint}
                </div>
            </label>
            <input id="import" className="sr-only" type="file" onChange={handleChange} />
            <div className="p-2 text-center ">Drop a file or click to upload</div>
        </div>
    );
}
