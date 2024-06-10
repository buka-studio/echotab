import { toast } from "@echotab/ui/Toast";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxyMap } from "valtio/utils";

import ChromeLocalStorage from "./ChromeLocalStorage";
import { version } from "./constants";
import { Tag } from "./models";
import { intersection } from "./util/set";

export const unassignedTag = {
    id: 0,
    color: "#000",
    name: "Untagged",
    favorite: false,
};

export const defaultTagColor = "#4338ca";

const defaultTags = [[unassignedTag.id, unassignedTag]] as [number, Tag][];

const storageKey = `cmdtab-tag-store-${version}`;

export interface TagStore {
    tags: Map<number, Tag>;
    tagsByName: Map<string, Tag>;
    initialized: boolean;
    getNextTagId(): number;
    createTag(name: string): Tag;
    deleteTag(tagId: number): void;
    deleteAllTags(): void;
    updateTag(tagId: number, updates: Partial<Pick<Tag, "name" | "color">>): void;
    toggleTagFavorite(tagId: number): void;
    import(imported: Partial<ImportedTagStore>): void;
    initStore(): Promise<void>;
}

type PersistedTagStore = Pick<TagStore, "tags">;
type ImportedTagStore = Partial<Pick<TagStore, "tags">>;

const store = proxy({
    tags: proxyMap<number, Tag>(defaultTags),
    initialized: false,
    getNextTagId: () => {
        const highestId = Math.max(...store.tags.keys(), 1);
        const newId = highestId + 1;

        return newId;
    },
    createTag: (name: string, color = defaultTagColor): Tag => {
        const newId = store.getNextTagId();

        const newTag = {
            color,
            id: newId,
            name: name.trim(),
            favorite: false,
        };

        if (!newTag.name) {
            toast.error("Tag name cannot be empty");
        }
        if (store.tagsByName.has(newTag.name)) {
            toast.error("Tag with this name already exists");
        }

        store.tags.set(newId, newTag);

        return newTag;
    },
    updateTag: (tagId: number, updates: Partial<Pick<Tag, "name" | "color">>) => {
        const tags = store.tags;
        if (!tags.has(tagId)) {
            return;
        }

        const newTag = { ...tags.get(tagId), ...updates } as Tag;
        store.tags.set(tagId, newTag);
    },
    deleteTag: (tagId: number) => {
        if (tagId === unassignedTag.id) {
            return;
        }
        store.tags.delete(tagId);
    },
    deleteAllTags: () => {
        store.tags.clear();
        store.tags.set(unassignedTag.id, unassignedTag);
    },
    toggleTagFavorite: (tagId: number) => {
        const tag = store.tags.get(tagId);
        if (!tag) {
            return;
        }
        tag.favorite = !tag.favorite;
    },
    import: (imported: Partial<ImportedTagStore>) => {
        const conflicts = intersection(imported.tags?.keys() || [], store.tags.keys());
        if (conflicts.size) {
            // shouldn't happen
            console.warn(conflicts);
        }

        for (const [k, v] of imported.tags || []) {
            store.tags.set(k, v);
        }
    },
    initStore: async () => {
        const stored = await ChromeLocalStorage.getItem(storageKey);

        if (stored) {
            try {
                const init = JSON.parse(stored as string) as PersistedTagStore;
                const storedTags = Object.entries(init.tags || []).map(([k, v]) => [
                    Number(k),
                    v,
                ]) as [number, Tag][];
                store.tags = proxyMap<number, Tag>(new Map(defaultTags.concat(storedTags)));
            } catch (e) {
                toast.error("Failed to load stored tags");
                console.error(e);
            }
        }
        store.initialized = true;
    },
}) as unknown as TagStore;

derive(
    {
        tagsByName: (get) => {
            const tags = get(store).tags;

            const byName = proxyMap([...tags.values()].map((v) => [v.name, v]));

            return byName;
        },
    },
    { proxy: store },
);

subscribe(store, () => {
    if (store.initialized) {
        const serialized = JSON.stringify({ tags: Object.fromEntries(store.tags.entries()) });
        ChromeLocalStorage.setItem(storageKey, serialized);
    }
});

export const useTagStore = () => useSnapshot(store) as typeof store;

export default store;
