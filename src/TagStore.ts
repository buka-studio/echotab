import { proxy, subscribe, useSnapshot } from "valtio";
import { proxyMap } from "valtio/utils";

import ChromeLocalStorage from "./ChromeLocalStorage";
import { version } from "./constants";
import { Tag } from "./models";
import { toast } from "./ui/Toast";
import { intersection } from "./util/set";

export const unassignedTag = {
    id: 0,
    color: "#000",
};

export const defaultTagColor = "#4338ca";

const defaultTags = [
    [
        unassignedTag.id,
        { color: "#000", name: "Unassigned", id: unassignedTag.id, favorite: false },
    ],
];

const storageKey = `cmdtab-tag-store-${version}`;

export interface TagStore {
    tags: Map<number, Tag>;
    initialized: boolean;
    createTag(name: string): Tag;
    deleteTag(tagId: number): void;
    updateTag(tagId: number, updates: Partial<Pick<Tag, "name" | "color">>): void;
    initStore(): Promise<void>;
}

type PersistedTagStore = Pick<TagStore, "tags">;
type ImportedTagStore = Partial<Pick<TagStore, "tags">>;

const store = proxy({
    tags: proxyMap<number, Tag>(defaultTags as [number, Tag][]),
    initialized: false,
    createTag: (name: string, color = defaultTagColor): Tag => {
        const highestId = Math.max(...store.tags.keys(), 1);
        const newId = highestId + 1;

        const newTag = {
            color,
            id: newId,
            name,
            favorite: false,
        };

        store.tags.set(newId, {
            color,
            id: newId,
            name,
            favorite: false,
        });

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
        store.tags.delete(tagId);
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
            toast.error("Failed to import tags");
            console.error(conflicts);
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
                store.tags = proxyMap<number, Tag>(
                    Object.entries(init.tags || []).map(([k, v]) => [Number(k), v]),
                );
            } catch (e) {
                toast.error("Failed to load stored tags");
                console.error(e);
            }
        }
        store.initialized = true;
    },
});

subscribe(store, () => {
    if (store.initialized) {
        const serialized = JSON.stringify({ tags: Object.fromEntries(store.tags.entries()) });
        ChromeLocalStorage.setItem(storageKey, serialized);
    }
});

store.initStore();

export const useTagStore = () => useSnapshot(store);

export default store;
