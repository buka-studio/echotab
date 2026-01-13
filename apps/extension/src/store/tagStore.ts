import { toast } from "@echotab/ui/Toast";
import dayjs from "dayjs";
import { useMemo } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { getUtcISO } from "~/util/date";

import { StoragePersistence } from "./persistence";
import { Tag, tagColors } from "./schema";

export const unassignedTag = {
  id: 0,
  color: "#000000",
  name: "Untagged",
  favorite: false,
};

export const defaultTagColor = "#4338ca";

const defaultTags: Tag[] = [unassignedTag as Tag];

export const useTagStore = create(
  subscribeWithSelector(() => ({
    tags: defaultTags,
    initialized: false,
  })),
);

type TagParams = {
  name: string;
  color?: string;
  isQuick?: boolean;
  isAI?: boolean;
};

const persistence = new StoragePersistence<Tag[]>({ key: "echotab-tag-store" });

export function pickRandomTagColor() {
  return tagColors[Math.floor(Math.random() * tagColors.length)] || defaultTagColor;
}

export const addTags = (tags: Tag[]) => {
  useTagStore.setState((state) => ({ tags: [...state.tags, ...tags] }));
};

export const deleteTag = (tagId: number) => {
  useTagStore.setState((state) => ({ tags: state.tags.filter((tag) => tag.id !== tagId) }));
};

export const updateTag = (tagId: number, updates: Partial<Tag>) => {
  useTagStore.setState((state) => ({
    tags: state.tags.map((tag) => (tag.id === tagId ? { ...tag, ...updates } : tag)),
  }));
};

export const toggleTagFavorite = (tagId: number) => {
  useTagStore.setState((state) => ({
    tags: state.tags.map((tag) => (tag.id === tagId ? { ...tag, favorite: !tag.favorite } : tag)),
  }));
};

export const getQuickSaveTagName = (unique?: boolean) => {
  const base = dayjs().format("D MMM"); // 17 Jan
  const lastTag = useTagStore
    .getState()
    .tags.filter((tag) => tag.isQuick)
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
};

export const getNextTagId = () => {
  const highestId = Math.max(...useTagStore.getState().tags.map((tag) => tag.id), 0);
  return highestId + 1;
};

export const getTagByName = (name: string) => {
  return useTagStore.getState().tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
};

export const createTags = (params: TagParams[]) => {
  const createdTags: Tag[] = [];

  for (const { name, color, isQuick, isAI } of params) {
    const newId = getNextTagId();

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

    const existing = getTagByName(newTag.name);
    if (existing) {
      createdTags.push(existing);
      continue;
    }

    createdTags.push({ ...newTag, createdAt: getUtcISO(), updatedAt: getUtcISO() });
  }

  useTagStore.setState((state) => ({ tags: [...state.tags, ...createdTags] }));

  return createdTags;
};

export const shuffleTagColors = () => {
  useTagStore.setState((state) => ({
    tags: state.tags.map((tag) => ({ ...tag, color: pickRandomTagColor() })),
  }));
};

export const deleteAllTags = () => {
  useTagStore.setState({ tags: defaultTags });
};

export const useTagsById = ({ onlyActive = false }: { onlyActive?: boolean } = {}) => {
  const tags = useTagStore((state) => state.tags);

  return useMemo(() => {
    return new Map(
      tags
        .filter(onlyActive ? (tag) => tag.id !== unassignedTag.id : () => true)
        .map((tag) => [tag.id, tag]),
    );
  }, [tags, onlyActive]);
};

export const useTagsByNormalizedName = () => {
  const tags = useTagStore((state) => state.tags);

  return useMemo(() => {
    return new Map(tags.map((tag) => [tag.name.toLowerCase(), tag]));
  }, [tags]);
};

export const getTagsNormalizedByName = () => {
  return new Map(useTagStore.getState().tags.map((tag) => [tag.name.toLowerCase(), tag]));
};

export const initStore = async () => {
  const stored = await persistence.load();
  if (stored) {
    useTagStore.setState({ tags: stored });
  }
  useTagStore.setState({ initialized: true });
};

useTagStore.subscribe((store) => {
  if (store.initialized) {
    persistence.save(store.tags);
  }
});

export const tagStoreActions = {
  addTags,
  deleteTag,
  updateTag,
  toggleTagFavorite,
  getQuickSaveTagName,
  getNextTagId,
  getTagByName,
  createTags,
  shuffleTagColors,
  deleteAllTags,
  getTagsNormalizedByName,
};
