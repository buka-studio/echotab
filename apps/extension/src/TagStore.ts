import { toast } from "@echotab/ui/Toast";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxyMap } from "valtio/utils";

import { tagColors, version } from "./constants";
import { Tag } from "./models";
import ChromeLocalStorage from "./util/ChromeLocalStorage";
import { intersection } from "./util/set";

export function pickRandomTagColor() {
  return tagColors[Math.floor(Math.random() * tagColors.length)];
}

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
  createTag(name: string, color?: string): Tag;
  createTags(tags: { name: string; color?: string }[]): Tag[];
  deleteTag(tagId: number): void;
  deleteAllTags(): void;
  updateTag(tagId: number, updates: Partial<Pick<Tag, "name" | "color">>): void;
  toggleTagFavorite(tagId: number): void;
  shuffleTagColors(): void;
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
  createTags: (tags: { name: string; color?: string }[]) => {
    const createdTags = [];

    for (const { name, color } of tags) {
      const newId = store.getNextTagId();

      const _color = color || pickRandomTagColor();

      const newTag = {
        color: _color,
        id: newId,
        name: name.trim(),
        favorite: false,
      };

      if (!newTag.name) {
        toast.error("Tag name cannot be empty");
        continue;
      }

      if (store.tagsByName.has(newTag.name)) {
        toast.error(`Tag with this name already exists: ${newTag.name}`);
        continue;
      }

      store.tags.set(newId, newTag);
      createdTags.push(newTag);
    }

    return createdTags;
  },
  createTag: (name: string, color?: string): Tag => {
    const [tag] = store.createTags([{ name, color }]);

    return tag;
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
  shuffleTagColors: () => {
    for (const [k, v] of store.tags.entries()) {
      if (k === unassignedTag.id) {
        continue;
      }

      const newColor = pickRandomTagColor();
      v.color = newColor;
    }
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
        const storedTags = Object.entries(init.tags || []).map(([k, v]) => [Number(k), v]) as [
          number,
          Tag,
        ][];
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
