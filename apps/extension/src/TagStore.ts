import { toast } from "@echotab/ui/Toast";
import dayjs from "dayjs";
import { derive } from "derive-valtio";
import { proxy, subscribe, useSnapshot } from "valtio";
import { proxyMap } from "valtio/utils";

import { tagColors, version } from "./constants";
import { Serializable, Tag } from "./models";
import ChromeLocalStorage from "./util/ChromeLocalStorage";
import { intersection } from "./util/set";

export function pickRandomTagColor() {
  return tagColors[Math.floor(Math.random() * tagColors.length)];
}

export const unassignedTag = {
  id: 0,
  color: "#000000",
  name: "Untagged",
  favorite: false,
};

export const defaultTagColor = "#4338ca";

const defaultTags = [[unassignedTag.id, unassignedTag]] as [number, Tag][];

const storageKey = `cmdtab-tag-store-${version}`;

export interface TagStore extends Serializable<PersistedTagStore> {
  tags: Map<number, Tag>;
  tagsByNormalizedName: Map<string, Tag>;
  initialized: boolean;
  getQuickSaveTagName(unique?: boolean): string;
  getTagByName(name: string): Tag | undefined;
  getNextTagId(): number;
  createTag(params: TagParams): Tag;
  createTags(params: TagParams[]): Tag[];
  deleteTag(tagId: number): void;
  deleteAllTags(): void;
  updateTag(tagId: number, updates: Partial<Pick<Tag, "name" | "color">>): void;
  toggleTagFavorite(tagId: number): void;
  shuffleTagColors(): void;
  import(imported: Partial<ImportedTagStore>): void;
  initStore(): Promise<void>;
}

type TagParams = {
  name: string;
  color?: string;
  isQuick?: boolean;
  isAI?: boolean;
};

type PersistedTagStore = Pick<TagStore, "tags">;
type ImportedTagStore = Partial<Pick<TagStore, "tags">>;

const Store = proxy({
  tags: proxyMap<number, Tag>(defaultTags),
  initialized: false,
  getQuickSaveTagName: (unique = true) => {
    const base = dayjs().format("D MMM"); // 17 Jan
    const lastTag = Array.from(Store.tags.values())
      .filter((tag) => tag.isQuick)
      .filter((tag) => tag.name.includes(base))
      .at(-1);

    if (!unique && lastTag?.name === base) {
      return lastTag.name;
    }

    const lastNumber = Number((lastTag?.name || "").split(" - ")[1]);
    if (Number.isFinite(lastNumber)) {
      const nextNumber = lastNumber + 1;
      return `${base} - ${nextNumber}`;
    }
    return `${base}`;
  },
  getNextTagId: () => {
    const highestId = Math.max(...Store.tags.keys(), 1);
    const newId = highestId + 1;

    return newId;
  },
  getTagByName: (name: string) => {
    return Store.tagsByNormalizedName.get(name.trim().toLowerCase());
  },
  createTags: (params: TagParams[]) => {
    const createdTags = [];

    for (const { name, color, isQuick, isAI } of params) {
      const newId = Store.getNextTagId();

      const _color = color || pickRandomTagColor();

      const newTag = {
        color: _color,
        id: newId,
        name: name.trim(),
        favorite: false,
        isQuick,
        isAI,
      };

      if (!newTag.name) {
        toast.error("Tag name cannot be empty");
        continue;
      }

      const existing = Store.getTagByName(newTag.name);
      if (existing) {
        createdTags.push(existing);
        continue;
      }

      Store.tags.set(newId, newTag);
      createdTags.push(newTag);
    }

    return createdTags;
  },
  createTag: (params: TagParams): Tag => {
    const [tag] = Store.createTags([params]);

    return tag;
  },
  updateTag: (tagId: number, updates: Partial<Pick<Tag, "name" | "color">>) => {
    const tags = Store.tags;
    if (!tags.has(tagId)) {
      return;
    }

    const newTag = { ...tags.get(tagId), ...updates } as Tag;
    Store.tags.set(tagId, newTag);
  },
  deleteTag: (tagId: number) => {
    if (tagId === unassignedTag.id) {
      return;
    }
    Store.tags.delete(tagId);
  },
  deleteAllTags: () => {
    Store.tags.clear();
    Store.tags.set(unassignedTag.id, unassignedTag);
  },
  toggleTagFavorite: (tagId: number) => {
    const tag = Store.tags.get(tagId);
    if (!tag) {
      return;
    }
    tag.favorite = !tag.favorite;
  },
  shuffleTagColors: () => {
    for (const [k, v] of Store.tags.entries()) {
      if (k === unassignedTag.id) {
        continue;
      }

      const newColor = pickRandomTagColor();
      v.color = newColor;
    }
  },
  import: (imported: Partial<ImportedTagStore>) => {
    const conflicts = intersection(imported.tags?.keys() || [], Store.tags.keys());
    if (conflicts.size) {
      // shouldn't happen
      console.warn(conflicts);
    }

    for (const [k, v] of imported.tags || []) {
      Store.tags.set(k, v);
    }
  },
  initStore: async () => {
    const stored = await ChromeLocalStorage.getItem(storageKey);

    if (stored) {
      const deserialized = Store.deserialize(stored as string);
      Object.assign(Store, deserialized);
    }

    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes[storageKey]) {
        const deserialized = Store.deserialize(changes[storageKey].newValue as string);
        Object.assign(Store, deserialized);
      }
    });

    Store.initialized = true;
  },
  serialize: () => {
    return JSON.stringify({ tags: Object.fromEntries(Store.tags.entries()) });
  },
  deserialize: (serialized: string): PersistedTagStore | undefined => {
    try {
      const init = JSON.parse(serialized) as PersistedTagStore;
      const storedTags = Object.entries(init.tags || []).map(([k, v]) => [Number(k), v]) as [
        number,
        Tag,
      ][];

      return { tags: proxyMap<number, Tag>(new Map(defaultTags.concat(storedTags))) };
    } catch (e) {
      toast.error("Failed to load stored tags");
      console.error(e);
    }
  },
}) as unknown as TagStore;

derive(
  {
    /**
     * Lowercased and trimmed tag names -> tags
     */
    tagsByNormalizedName: (get) => {
      const tags = get(Store).tags;

      const byName = proxyMap([...tags.values()].map((v) => [v.name.trim().toLowerCase(), v]));

      return byName;
    },
  },
  { proxy: Store },
);

subscribe(Store, () => {
  if (Store.initialized) {
    const serialized = Store.serialize();
    ChromeLocalStorage.setItem(storageKey, serialized);
  }
});

export const useTagStore = () => useSnapshot(Store) as typeof Store;

export default Store;
